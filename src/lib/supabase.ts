import { createClient } from '@supabase/supabase-js';

// User provided URL
const UP_URL = 'https://uukgdqgldfbwpjxiswko.supabase.co';
// PLACEHOLDER - User needs to provide the real key
const UP_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1a2dkcWdsZGZid3BqeGlzd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjY2NzgsImV4cCI6MjA4NDU0MjY3OH0.ylRUT0gKbSvQ7ImPXNcTeyT6GZTB2VdCM9ekYzU-vPU';

export const supabase = createClient(UP_URL, UP_KEY);
