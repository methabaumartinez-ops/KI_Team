(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/orchestrator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'hola' })
        });
        const text = await res.text();
        if (text.includes('"message":')) {
            const matches = text.match(/"message":"([^"]+)"/g);
            console.log("Found messages:", matches);
        } else {
            console.log("Raw text snippet:", text.substring(0, 500));
        }
    } catch(e) {
        console.error(e);
    }
})();
