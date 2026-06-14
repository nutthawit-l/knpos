export interface Env {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM Product ORDER BY created_at DESC',
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();

    const name = formData.get('name') as string;
    const thaPrice = parseFloat(formData.get('tha_price') as string);
    const sgpPrice = formData.get('sgp_price')
      ? parseFloat(formData.get('sgp_price') as string)
      : null;
    const idnPrice = formData.get('idn_price')
      ? parseFloat(formData.get('idn_price') as string)
      : null;
    const deuPrice = formData.get('deu_price')
      ? parseFloat(formData.get('deu_price') as string)
      : null;
    const jpnPrice = formData.get('jpn_price')
      ? parseFloat(formData.get('jpn_price') as string)
      : null;
    const chnPrice = formData.get('chn_price')
      ? parseFloat(formData.get('chn_price') as string)
      : null;
    const twnPrice = formData.get('twn_price')
      ? parseFloat(formData.get('twn_price') as string)
      : null;
    const korPrice = formData.get('kor_price')
      ? parseFloat(formData.get('kor_price') as string)
      : null;

    const imageFile = formData.get('image') as File;

    if (!name || isNaN(thaPrice) || !imageFile || !imageFile.name) {
      return new Response('Missing required fields', { status: 400 });
    }

    const filename = `${Date.now()}-${imageFile.name}`;
    await context.env.IMAGES_BUCKET.put(filename, imageFile.stream());
    console.log(`${context.env}`);
    const imageUrl = `${context.env.R2_PUBLIC_URL}/${filename}`;

    const { success } = await context.env.DB.prepare(
      `INSERT INTO Product (name, tha_price, sgp_price, idn_price, deu_price, jpn_price, chn_price, twn_price, kor_price, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        name,
        thaPrice,
        sgpPrice,
        idnPrice,
        deuPrice,
        jpnPrice,
        chnPrice,
        twnPrice,
        korPrice,
        imageUrl,
      )
      .run();

    if (success) {
      return new Response(JSON.stringify({ success: true, imageUrl }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Database insert failed', { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
