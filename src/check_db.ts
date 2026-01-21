
import { supabase } from './lib/supabase';

async function check() {
    const { data, error } = await supabase.from('tasks').select('position').limit(1);
    if (error) {
        console.log('Error selecting position:', error.message);
    } else {
        console.log('Position column exists');
    }
}

check();
