export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageB64, mimeType, isPdf } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing' });
    }

    if (!imageB64) {
      return res.status(400).json({ error: 'No image or PDF data provided' });
    }

    const prompt = `You are a data extraction system for NIMC Nigeria NIN slips.
Extract these fields EXACTLY as printed on the slip:
1. NIN (11-digit number — look for "NIN:" label)
2. Surname (look for "Surname:" label)
3. First Name (look for "First Name:" label)  
4. Middle Name (look for "Middle Name:" label, null if absent)
5. Gender (M or F from "Gender:" field)
6. Date of Birth — IMPORTANT: NIN slips do NOT print DOB directly. Look carefully for any date field. If not found, return null.
7. Address (from "Address:" field)

Return ONLY valid JSON, no markdown, no explanation:
{"nin":"...","surname":"...","firstname":"...","middlename":"...","gender":"...","dob":null,"address":"..."}`;

    const parts = [
      { text: prompt },
      {
        inline_data: {
          mime_type: mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
          data: imageB64
        }
      }
    ];

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Failed to call Gemini API' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Clean up any markdown code blocks
    const cleaned = text.replace(/```json|```/gi, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse Gemini output:', text);
      return res.status(500).json({ error: 'Invalid response from AI model' });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'Internal server error processing the document' });
  }
}
