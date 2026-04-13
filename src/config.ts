import type { APIRoute } from "astro";
import { configYaml } from "virtual:decap-cms-config";


export const GET: APIRoute = () => {
    return new Response(configYaml, {
        headers: {
            "content-type": "text/yaml; charset=utf-8",
        },
    });
};