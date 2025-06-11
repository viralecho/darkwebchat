// functions/chat.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    // DELETE handler — clears all messages
    if (event.httpMethod === 'DELETE') {
      console.log('Attempting to delete all messages...');
      const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('Delete failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'cleared' }),
      };
    }

    // POST handler — inserts new message
    if (event.httpMethod === 'POST') {
      const { message } = JSON.parse(event.body);
      const clean = message.replace(/<[^>]*>/g, '');
      await supabase
        .from('messages')
        .insert([{ message: clean }]);
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
    }

    // GET handler — fetch messages
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created', { ascending: true })
      .limit(1000);

    if (error) throw error;

    // Auto-cleanup: delete old messages (older than 30 mins)
    const deleteOlderThan = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from('messages')
      .delete()
      .lt('created', deleteOlderThan);

    if (cleanupError) console.error('Auto-cleanup failed:', cleanupError);

    const lines = data.map(d => `[${new Date(d.created).toISOString()}] ${d.message}`);
    return { statusCode: 200, headers, body: JSON.stringify(lines) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
