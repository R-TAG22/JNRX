import { supabaseAuthProvider } from '../providers/supabase/supabaseAuthProvider';
import { IAuthService } from './types';

export const authService: IAuthService = supabaseAuthProvider;
