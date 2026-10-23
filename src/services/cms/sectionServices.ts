import { supabaseContentProvider } from '../providers/supabase/supabaseContentProvider';
import { IPortfolioService, IPackageService, IProcessService, IFAQService } from './types';

export const portfolioService: IPortfolioService = supabaseContentProvider;
export const packageService: IPackageService = supabaseContentProvider;
export const processService: IProcessService = supabaseContentProvider;
export const faqService: IFAQService = supabaseContentProvider;
