import type { AstroConfig, AstroIntegration } from "astro";
import { envField } from "astro/config";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";


export interface DecapCMSOptions {
    configPath?: string;
    decapCMSSrcUrl?: string;
    decapCMSVersion?: string;
    adminDisabled?: boolean;
    adminRoute?: string;
    oauthDisabled?: boolean;
    oauthLoginRoute?: string;
    oauthCallbackRoute?: string;
}
const defaultOptions: DecapCMSOptions = {
    configPath: "public/admin/config.yml",
    decapCMSSrcUrl: "",
    decapCMSVersion: "3.3.3",
    adminDisabled: false,
    adminRoute: "/admin",
    oauthDisabled: false,
    oauthLoginRoute: "/oauth",
    oauthCallbackRoute: "/oauth/callback",
};

const WHITELIST = [
    "backend",
    "site_url",
    "display_url",
    "logo",
    "logo_url",
    "media_folder",
    "public_folder",
    "collections",
    "publish_mode",
    "show_preview_links",
    "slug",
    "local_backend",
    "i18n",
    "media_library",
    "editor",
    "search",
    "locale",
];

export default function decapCMS(options: DecapCMSOptions = {}): AstroIntegration {
    const {
        configPath,
        decapCMSSrcUrl,
        decapCMSVersion,
        adminDisabled,
        adminRoute,
        oauthDisabled,
        oauthLoginRoute,
        oauthCallbackRoute,
    } = {
        ...defaultOptions,
        ...options,
    };

    if (!adminRoute?.startsWith("/") || !oauthLoginRoute?.startsWith("/") || !oauthCallbackRoute?.startsWith("/")) {
        throw new Error('`adminRoute`, `oauthLoginRoute` and `oauthCallbackRoute` options must start with "/"');
    }

    const normalizedAdminRoute =
        adminRoute && adminRoute.endsWith("/")
            ? adminRoute.replace(/\/+$/, "")
            : adminRoute;

    return {
        name: "astro-decap-cms-oauth",
        hooks: {
            "astro:config:setup": async ({ injectRoute, updateConfig, config }) => {
                const env: AstroConfig["env"] = { validateSecrets: true, schema: {} };

                let validatedConfigYaml = "";
                let adminSetupFailed = false;

                if (!adminDisabled) {
                    // Resolve config path
                    const rootDir = fileURLToPath(config.root);
                    const effectiveConfigPath = configPath ?? defaultOptions.configPath!;
                    let absoluteConfigPath = path.resolve(rootDir, effectiveConfigPath);

                    if (!(await fsPromises.access(absoluteConfigPath).then(() => true).catch(() => false))) {
                        const fallbackPath = path.resolve(rootDir, "public/admin/config.yml");
                        if (await fsPromises.access(fallbackPath).then(() => true).catch(() => false)) {
                            absoluteConfigPath = fallbackPath;
                        } else {
                            throw new Error(`Decap CMS config file not found at ${effectiveConfigPath} or ${fallbackPath}`);
                        }
                    }

                    // Read and validate config
                    try {
                        const fileContent = await fsPromises.readFile(absoluteConfigPath, "utf8");
                        const rawConfig = yaml.load(fileContent);
                        if (
                            typeof rawConfig !== "object" ||
                            rawConfig === null ||
                            Array.isArray(rawConfig)
                        ) {
                            console.error("Decap CMS configuration must be a YAML object.");
                            adminSetupFailed = true;
                        } else {
                            const parsedConfig = rawConfig as Record<string, any>;

                            if (!parsedConfig.backend || !parsedConfig.collections) {
                                console.error("Decap CMS configuration is missing required fields: 'backend' or 'collections'. Admin dashboard will be disabled.");
                                adminSetupFailed = true;
                            } else {
                                // Whitelist filtering
                                const filteredConfig: Record<string, any> = {};
                                for (const key of WHITELIST) {
                                    if (key in parsedConfig) {
                                        filteredConfig[key] = parsedConfig[key];
                                    }
                                }

                                validatedConfigYaml = yaml.dump(filteredConfig);
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to parse Decap CMS config: ${e}`);
                        adminSetupFailed = true;
                    }

                    if (!adminSetupFailed) {
                        env.schema!.PUBLIC_DECAP_CMS_SRC_URL = envField.string({
                            context: "client",
                            access: "public",
                            optional: true,
                            default: decapCMSSrcUrl,
                        });
                        env.schema!.PUBLIC_DECAP_CMS_VERSION = envField.string({
                            context: "client",
                            access: "public",
                            optional: true,
                            default: decapCMSVersion,
                        });

                        // mount DecapCMS admin route
                        injectRoute({
                            pattern: normalizedAdminRoute,
                            entrypoint: "astro-decap-cms-oauth/src/admin.astro",
                        });

                        // mount DecapCMS config route
                        injectRoute({
                            pattern: `${normalizedAdminRoute}/config.yml`,
                            entrypoint: "astro-decap-cms-oauth/src/config.ts",
                        });
                    }
                }

                if (!oauthDisabled) {
                    env.schema!.OAUTH_GITHUB_CLIENT_ID = envField.string({
                        context: "server",
                        access: "secret",
                    });
                    env.schema!.OAUTH_GITHUB_CLIENT_SECRET = envField.string({
                        context: "server",
                        access: "secret",
                    });
                    env.schema!.OAUTH_GITHUB_REPO_ID = envField.string({
                        context: "server",
                        access: "secret",
                        optional: true,
                        default: "",
                    });

                    // mount OAuth backend - sign in route
                    injectRoute({
                        pattern: oauthLoginRoute,
                        entrypoint: "astro-decap-cms-oauth/src/oauth/index.ts",
                    });

                    // mount OAuth backend - callback route
                    injectRoute({
                        pattern: oauthCallbackRoute,
                        entrypoint: "astro-decap-cms-oauth/src/oauth/callback.ts",
                    });
                }

                // apply env schema & defaults
                updateConfig({
                    env,
                    vite: {
                        plugins: [
                            {
                                name: "decap-cms-config",
                                resolveId(id) {
                                    if (id === "virtual:decap-cms-config") {
                                        return "\0virtual:decap-cms-config";
                                    }
                                },
                                load(id) {
                                    if (id === "\0virtual:decap-cms-config") {
                                        return `export const configYaml = ${JSON.stringify(validatedConfigYaml)};`;
                                    }
                                },
                            },
                        ],
                    },
                });
            },
        },
    };
}