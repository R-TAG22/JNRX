import {
  WebsiteContent,
  PortfolioProject,
  PricingPackage,
  ProcessStepItem,
  FAQItem,
} from '../../../types/cms';
import {
  IContentService,
  IPortfolioService,
  IPackageService,
  IProcessService,
  IFAQService,
} from '../../cms/types';
import { mockContentProvider } from '../mock/mockContentProvider';
import { supabase } from '../../../supabaseClient';

export class SupabaseContentProvider
  implements IContentService, IPortfolioService, IPackageService, IProcessService, IFAQService
{
  private isSupabaseSyncEnabled = true;

  constructor() {
    this.hydrateFromSupabase();
  }

  private async hydrateFromSupabase(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const { data, error } = await supabase
        .from('cms_content')
        .select('content_type, data')
        .in('content_type', ['published', 'draft']);

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          if (row.content_type === 'published' && row.data) {
            localStorage.setItem('jnrx_cms_published_v6', JSON.stringify(row.data));
          } else if (row.content_type === 'draft' && row.data) {
            localStorage.setItem('jnrx_cms_draft_v6', JSON.stringify(row.data));
          }
        }
      }
    } catch {
      // Table may not exist yet in user's Supabase project; gracefully continue
    }
  }

  async getWebsiteContent(previewDraft = false): Promise<WebsiteContent> {
    if (this.isSupabaseSyncEnabled) {
      try {
        const { data, error } = await supabase
          .from('cms_content')
          .select('data')
          .eq('content_type', previewDraft ? 'draft' : 'published')
          .single();

        if (!error && data?.data) {
          return data.data as WebsiteContent;
        }
      } catch {
        // Table not ready, fallback to local
      }
    }

    return mockContentProvider.getWebsiteContent(previewDraft);
  }

  async updateWebsiteContent(content: Partial<WebsiteContent>): Promise<WebsiteContent> {
    const updated = await mockContentProvider.updateWebsiteContent(content);

    if (this.isSupabaseSyncEnabled) {
      try {
        await supabase.from('cms_content').upsert(
          [
            {
              content_type: 'draft',
              data: updated,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'content_type' }
        );
      } catch (e) {
        console.warn('Supabase draft sync skipped:', e);
      }
    }

    return updated;
  }

  async getSection<K extends keyof WebsiteContent>(sectionKey: K, previewDraft = false): Promise<WebsiteContent[K]> {
    return mockContentProvider.getSection(sectionKey, previewDraft);
  }

  async updateSection<K extends keyof WebsiteContent>(
    sectionKey: K,
    data: WebsiteContent[K]
  ): Promise<WebsiteContent[K]> {
    const updatedSection = await mockContentProvider.updateSection(sectionKey, data);
    const draft = await mockContentProvider.getWebsiteContent(true);

    if (this.isSupabaseSyncEnabled) {
      try {
        await supabase.from('cms_content').upsert(
          [
            {
              content_type: 'draft',
              data: draft,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'content_type' }
        );
      } catch (e) {
        console.warn('Supabase updateSection sync skipped:', e);
      }
    }

    return updatedSection;
  }

  async publishAll(): Promise<WebsiteContent> {
    const published = await mockContentProvider.publishAll();

    if (this.isSupabaseSyncEnabled) {
      try {
        await supabase.from('cms_content').upsert(
          [
            {
              content_type: 'published',
              data: published,
              updated_at: new Date().toISOString(),
            },
            {
              content_type: 'draft',
              data: published,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'content_type' }
        );
      } catch (e) {
        console.warn('Supabase publishAll sync skipped:', e);
      }
    }

    return published;
  }

  async discardDrafts(): Promise<WebsiteContent> {
    const reverted = await mockContentProvider.discardDrafts();

    if (this.isSupabaseSyncEnabled) {
      try {
        await supabase.from('cms_content').upsert(
          [
            {
              content_type: 'draft',
              data: reverted,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'content_type' }
        );
      } catch (e) {
        console.warn('Supabase discardDrafts sync skipped:', e);
      }
    }

    return reverted;
  }

  // Delegate portfolio methods
  async getPortfolioProjects(includeDrafts?: boolean): Promise<PortfolioProject[]> {
    return mockContentProvider.getPortfolioProjects(includeDrafts);
  }

  async createPortfolioProject(
    project: Omit<PortfolioProject, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PortfolioProject> {
    const created = await mockContentProvider.createPortfolioProject(project);
    await this.syncDraftToSupabase();
    return created;
  }

  async updatePortfolioProject(id: string, project: Partial<PortfolioProject>): Promise<PortfolioProject> {
    const updated = await mockContentProvider.updatePortfolioProject(id, project);
    await this.syncDraftToSupabase();
    return updated;
  }

  async deletePortfolioProject(id: string): Promise<void> {
    await mockContentProvider.deletePortfolioProject(id);
    await this.syncDraftToSupabase();
  }

  async duplicatePortfolioProject(id: string): Promise<PortfolioProject> {
    const duplicated = await mockContentProvider.duplicatePortfolioProject(id);
    await this.syncDraftToSupabase();
    return duplicated;
  }

  async reorderPortfolioProjects(orderedIds: string[]): Promise<PortfolioProject[]> {
    const reordered = await mockContentProvider.reorderPortfolioProjects(orderedIds);
    await this.syncDraftToSupabase();
    return reordered;
  }

  // Delegate package methods
  async getPackages(includeDrafts?: boolean): Promise<PricingPackage[]> {
    return mockContentProvider.getPackages(includeDrafts);
  }

  async createPackage(pkg: Omit<PricingPackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingPackage> {
    const created = await mockContentProvider.createPackage(pkg);
    await this.syncDraftToSupabase();
    return created;
  }

  async updatePackage(id: string, pkg: Partial<PricingPackage>): Promise<PricingPackage> {
    const updated = await mockContentProvider.updatePackage(id, pkg);
    await this.syncDraftToSupabase();
    return updated;
  }

  async deletePackage(id: string): Promise<void> {
    await mockContentProvider.deletePackage(id);
    await this.syncDraftToSupabase();
  }

  async duplicatePackage(id: string): Promise<PricingPackage> {
    const duplicated = await mockContentProvider.duplicatePackage(id);
    await this.syncDraftToSupabase();
    return duplicated;
  }

  async reorderPackages(orderedIds: string[]): Promise<PricingPackage[]> {
    const reordered = await mockContentProvider.reorderPackages(orderedIds);
    await this.syncDraftToSupabase();
    return reordered;
  }

  // Delegate process methods
  async getProcessSteps(): Promise<ProcessStepItem[]> {
    return mockContentProvider.getProcessSteps();
  }

  async createProcessStep(step: Omit<ProcessStepItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProcessStepItem> {
    const created = await mockContentProvider.createProcessStep(step);
    await this.syncDraftToSupabase();
    return created;
  }

  async updateProcessStep(id: string, step: Partial<ProcessStepItem>): Promise<ProcessStepItem> {
    const updated = await mockContentProvider.updateProcessStep(id, step);
    await this.syncDraftToSupabase();
    return updated;
  }

  async deleteProcessStep(id: string): Promise<void> {
    await mockContentProvider.deleteProcessStep(id);
    await this.syncDraftToSupabase();
  }

  async reorderProcessSteps(orderedIds: string[]): Promise<ProcessStepItem[]> {
    const reordered = await mockContentProvider.reorderProcessSteps(orderedIds);
    await this.syncDraftToSupabase();
    return reordered;
  }

  // Delegate FAQ methods
  async getFAQs(includeDrafts?: boolean): Promise<FAQItem[]> {
    return mockContentProvider.getFAQs(includeDrafts);
  }

  async createFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FAQItem> {
    const created = await mockContentProvider.createFAQ(faq);
    await this.syncDraftToSupabase();
    return created;
  }

  async updateFAQ(id: string, faq: Partial<FAQItem>): Promise<FAQItem> {
    const updated = await mockContentProvider.updateFAQ(id, faq);
    await this.syncDraftToSupabase();
    return updated;
  }

  async deleteFAQ(id: string): Promise<void> {
    await mockContentProvider.deleteFAQ(id);
    await this.syncDraftToSupabase();
  }

  async reorderFAQs(orderedIds: string[]): Promise<FAQItem[]> {
    const reordered = await mockContentProvider.reorderFAQs(orderedIds);
    await this.syncDraftToSupabase();
    return reordered;
  }

  private async syncDraftToSupabase(): Promise<void> {
    if (!this.isSupabaseSyncEnabled) return;
    try {
      const draft = await mockContentProvider.getWebsiteContent(true);
      await supabase.from('cms_content').upsert(
        [
          {
            content_type: 'draft',
            data: draft,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'content_type' }
      );
    } catch (e) {
      console.warn('Supabase draft sync error:', e);
    }
  }
}

export const supabaseContentProvider = new SupabaseContentProvider();
