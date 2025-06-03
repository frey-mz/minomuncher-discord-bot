import { parseReplay } from "./replayParser/parser";

Bun.serve({
    port: 2828,
    routes: {
        "/api/status": new Response("OK"),
        "/api/minomuncher": {
            POST: async req => {
                console.log("new req")
                try{
                const body = await req.text();
                console.log(body.slice(0,10))
                const result = parseReplay(body, [])
                return Response.json(result)
                }catch(e){
                    let response = new Response("error parsing replay", {
                        status: 400
                    })
                    return response
                }

            },
        },
    },
});