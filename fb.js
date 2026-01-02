export default {
  async fetch(request) {
    const url = new URL(request.url);
    const inputUrl = url.searchParams.get('url');

    // Step 1: Validate Input
    const fbRegex = /(facebook\.com|fb\.watch|fb\.com|m\.facebook\.com|instagram\.com)/;
    
    if (!inputUrl || !fbRegex.test(inputUrl)) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing or invalid Facebook URL. Make sure the link is Public.'
        }, null, 2),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let finalResult = null;

    // --- METHOD 1: Cobalt API (Best & Most Reliable) ---
    try {
      console.log('Trying Method 1: Cobalt API');
      const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          url: inputUrl,
          vQuality: '720' // Koshish karein HD lene ki
        })
      });

      if (cobaltResponse.ok) {
        const data = await cobaltResponse.json();
        // Cobalt ka response structure simple hota hai
        if (data.url) {
          finalResult = {
            video: data.url,
            thumbnail: null, // Cobalt hamesha thumb nahi deta
            title: "Facebook Video",
            method: "Cobalt API"
          };
        }
      }
    } catch (err) {
      console.log(`Cobalt API failed: ${err.message}`);
    }

    // --- METHOD 2: Direct HTML Scraping (Fallback for Public Videos) ---
    if (!finalResult) {
      try {
        console.log('Trying Method 2: Direct Scraping');
        // User-Agent change karna zaroori hai taaki FB bot na samjhe
        const scrapeResponse = await fetch(inputUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        });

        if (scrapeResponse.ok) {
          const html = await scrapeResponse.text();
          
          // Regex se video URL dhoondhte hain (HD aur SD)
          // FB source code mein "hd_src":"..." ya "sd_src":"..." hota hai
          const hdMatch = html.match(/"hd_src":"([^"]+)"/);
          const sdMatch = html.match(/"sd_src":"([^"]+)"/);
          
          // Video URL aksar encoded hota hai (\u0026), usko decode karna padega
          const cleanUrl = (encodedUrl) => {
            if (!encodedUrl) return null;
            return encodedUrl.replace(/\\u0026/g, '&').replace(/\\/g, '');
          };

          const videoUrl = cleanUrl(hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null));

          if (videoUrl) {
             // Title dhoondhne ki koshish (og:title)
             const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
             
             finalResult = {
               video: videoUrl,
               thumbnail: null,
               title: titleMatch ? titleMatch[1] : "Facebook Scraped Video",
               method: "Direct Scrape"
             };
          }
        }
      } catch (err) {
        console.log(`Direct Scrape failed: ${err.message}`);
      }
    }

    // --- Final Response Output ---
    if (finalResult && finalResult.video) {
      return new Response(
        JSON.stringify({
          status: 'success',
          video: finalResult.video,
          thumbnail: finalResult.thumbnail,
          title: finalResult.title,
          method: finalResult.method,
          channel: '@old_studio786'
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Agar sab fail ho jaye
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Failed to fetch video. Ensure link is public and valid.',
        tips: 'Try a public Reel or Watch link. Private groups/profiles cannot be downloaded via API.',
        channel: '@old_studio786'
      }, null, 2),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
