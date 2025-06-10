const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  try {
    if (event.httpMethod === 'POST') {
      const { message } = JSON.parse(event.body);
      const clean = message.replace(/<[^>]*>/g, '');
      const { error } = await supabase
        .from('messages')
        .insert([{ message: clean }]);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created', { ascending: true })
      .limit(1000);
    if (error) throw error;

    const lines = data.map(d =>
      `[${new Date(d.created).toISOString()}] ${d.message}`
    );

    return { statusCode: 200, headers, body: JSON.stringify(lines) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
