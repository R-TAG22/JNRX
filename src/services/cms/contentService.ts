import { supabaseContentProvider } from '../providers/supabase/supabaseContentProvider';
import { IContentService } from './types';

// The application interacts with this abstract content service.
// Now connected to Supabase backend provider with automatic local fallback.
export const contentService: IContentService = supabaseContentProvider;
