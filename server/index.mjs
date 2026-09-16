import http from 'http';
import { Client } from 'pg';

const PORT = 3001;
const DB_URL = 'postgresql://postgres:Cubic%402163kau@db.ckcmvlbobfitcagyxtdz.supabase.co:5432/postgres';

function getPgClient() {
  return new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    // GET ALL CATALOG DATA
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      const client = getPgClient();
      await client.connect();

      const catRes = await client.query('SELECT * FROM public.categories ORDER BY created_at ASC;');
      const subRes = await client.query('SELECT * FROM public.subcategories ORDER BY created_at ASC;');
      const prodRes = await client.query('SELECT * FROM public.products ORDER BY created_at DESC;');

      await client.end();

      const categories = catRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      const subcategories = subRes.rows.map((r) => ({
        id: r.id,
        categoryId: r.category_id,
        name: r.name,
        description: r.description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      const products = prodRes.rows.map((r) => ({
        id: r.id,
        categoryId: r.category_id,
        subcategoryId: r.subcategory_id,
        name: r.name,
        dimensions: r.dimensions,
        calculatorState: r.calculator_state,
        calculationResult: r.calculation_result,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      sendJson(res, 200, { categories, subcategories, products });
      return;
    }

    // BODY PARSER FOR POST/PUT
    let bodyText = '';
    if (['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
      for await (const chunk of req) {
        bodyText += chunk;
      }
    }
    const body = bodyText ? JSON.parse(bodyText) : {};

    // SAVE CATEGORY
    if (req.method === 'POST' && url.pathname === '/api/categories') {
      const client = getPgClient();
      await client.connect();
      const { id, name, description } = body;
      await client.query(
        `INSERT INTO public.categories (id, name, description, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET name = $2, description = $3, updated_at = NOW();`,
        [id, name, description || '']
      );
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    // DELETE CATEGORY
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/categories/')) {
      const catId = url.pathname.replace('/api/categories/', '');
      const client = getPgClient();
      await client.connect();
      await client.query('DELETE FROM public.categories WHERE id = $1;', [catId]);
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    // SAVE SUBCATEGORY
    if (req.method === 'POST' && url.pathname === '/api/subcategories') {
      const client = getPgClient();
      await client.connect();
      const { id, categoryId, name, description } = body;
      await client.query(
        `INSERT INTO public.subcategories (id, category_id, name, description, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET category_id = $2, name = $3, description = $4, updated_at = NOW();`,
        [id, categoryId, name, description || '']
      );
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    // DELETE SUBCATEGORY
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/subcategories/')) {
      const subId = url.pathname.replace('/api/subcategories/', '');
      const client = getPgClient();
      await client.connect();
      await client.query('DELETE FROM public.subcategories WHERE id = $1;', [subId]);
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    // SAVE PRODUCT
    if (req.method === 'POST' && url.pathname === '/api/products') {
      const client = getPgClient();
      await client.connect();
      const { id, categoryId, subcategoryId, name, dimensions, calculatorState, calculationResult } = body;
      await client.query(
        `INSERT INTO public.products (id, category_id, subcategory_id, name, dimensions, calculator_state, calculation_result, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           category_id = $2, 
           subcategory_id = $3, 
           name = $4, 
           dimensions = $5::jsonb, 
           calculator_state = $6::jsonb, 
           calculation_result = $7::jsonb, 
           updated_at = NOW();`,
        [
          id,
          categoryId,
          subcategoryId,
          name,
          JSON.stringify(dimensions || []),
          JSON.stringify(calculatorState || {}),
          JSON.stringify(calculationResult || {}),
        ]
      );
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    // DELETE PRODUCT
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/products/')) {
      const prodId = url.pathname.replace('/api/products/', '');
      const client = getPgClient();
      await client.connect();
      await client.query('DELETE FROM public.products WHERE id = $1;', [prodId]);
      await client.end();
      sendJson(res, 200, { success: true });
      return;
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
  } catch (err) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Supabase Backend Sync Server running at http://localhost:${PORT}`);
});
