import {
    batchInventoryItemLevelsWorkflow,
    createApiKeysWorkflow,
    createCollectionsWorkflow,
    createCustomerAccountWorkflow,
    createProductCategoriesWorkflow,
    createProductsWorkflow,
    createProductTagsWorkflow,
    createRegionsWorkflow,
    createSalesChannelsWorkflow,
    createShippingOptionsWorkflow,
    createShippingProfilesWorkflow,
    createStockLocationsWorkflow,
    createTaxRegionsWorkflow,
    createUserAccountWorkflow,
    linkSalesChannelsToApiKeyWorkflow,
    linkSalesChannelsToStockLocationWorkflow,
    updateStoresWorkflow,
} from "@medusajs/core-flows";
import {
    ExecArgs,
    IFulfillmentModuleService,
    ISalesChannelModuleService,
    IStoreModuleService,
} from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    ModuleRegistrationName,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa";
import { Link } from "@medusajs/modules-sdk";
import { ModuleCreateReview } from "@starter/types";
import { jwtDecode } from "jwt-decode";
import { createReviewsWorkflow } from "src/workflows/review/workflows";

export default async function seedDemoData({ container }: ExecArgs) {
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const remoteLink: Link = container.resolve(
        ContainerRegistrationKeys.REMOTE_LINK
    );
    const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
        ModuleRegistrationName.FULFILLMENT
    );
    const salesChannelModuleService: ISalesChannelModuleService =
        container.resolve(ModuleRegistrationName.SALES_CHANNEL);
    const storeModuleService: IStoreModuleService = container.resolve(
        ModuleRegistrationName.STORE
    );

    const commonPassword = "supersecret";
    const inventoryModuleService = container.resolve(ModuleRegistrationName.INVENTORY)
    const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT)
    const customerModuleService = container.resolve(ModuleRegistrationName.CUSTOMER)

    const countries = ["gb", "de", "dk", "se", "fr", "es", "it", "vn", "la", "kh"];
    const asia_contries = countries.slice(-3);
    const europe_countries = countries.slice(0, 7);

    logger.info("Seeding store data...");
    const [store] = await storeModuleService.listStores();
    let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    if (!defaultSalesChannel.length) {
        // create the default sales channel
        const { result: salesChannelResult } = await createSalesChannelsWorkflow(
            container
        ).run({
            input: {
                salesChannelsData: [
                    {
                        name: "Default Sales Channel",
                    },
                ],
            },
        });
        defaultSalesChannel = salesChannelResult;
    }

    await updateStoresWorkflow(container).run({
        input: {
            selector: { id: store.id },
            update: {
                name: "C.V.O.S",
                supported_currencies: [
                    {
                        currency_code: "usd",
                        is_default: true,
                    },
                    {
                        currency_code: "eur",
                    },
                    {
                        currency_code: "vnd",
                    },
                    {
                        currency_code: "khr",
                    },
                    {
                        currency_code: "lak",
                    },
                ],
                default_sales_channel_id: defaultSalesChannel[0].id,
            },
        },
    });
    logger.info("Seeding region data...");
    const { result: regionResult } = await createRegionsWorkflow(container).run({
        input: {
            regions: [
                {
                    name: "Europe",
                    currency_code: "eur",
                    countries: europe_countries,
                    payment_providers: ["pp_system_default", "pp_stripe_stripe"],
                },
                {
                    name: "Viet Nam",
                    currency_code: "vnd",
                    countries: ["vn"],
                    payment_providers: ["pp_system_default", "pp_stripe_stripe"],
                },
                {
                    name: "Laos",
                    currency_code: "lak",
                    countries: ["la"],
                    payment_providers: ["pp_system_default", "pp_stripe_stripe"],
                },
                {
                    name: "Cambodia",
                    currency_code: "khr",
                    countries: ["kh"],
                    payment_providers: ["pp_system_default", "pp_stripe_stripe"],
                },
            ],
        },
    });
    const region = regionResult[0];
    logger.info("Finished seeding regions.");

    logger.info("Seeding tax regions...");
    await createTaxRegionsWorkflow(container).run({
        input: countries.map((country_code) => ({
            country_code,
        })),
    });
    logger.info("Finished seeding tax regions.");

    logger.info("Seeding stock location data...");
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
        container
    ).run({
        input: {
            locations: [
                {
                    name: "European Warehouse",
                    address: {
                        city: "Copenhagen",
                        country_code: "DK",
                        address_1: "",
                    },
                },
                {
                    name: "Indochine Warehouse",
                    address: {
                        city: "Ho Chi Minh",
                        country_code: "VN",
                        address_1: "",
                    },
                },
            ],
        },
    });
    const stockLocation = stockLocationResult[0];

    await remoteLink.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_provider_id: "manual_manual",
        },
    });

    logger.info("Seeding fulfillment data...");
    const { result: shippingProfileResult } =
        await createShippingProfilesWorkflow(container).run({
            input: {
                data: [
                    {
                        name: "Default",
                        type: "default",
                    },
                ],
            },
        });
    const shippingProfile = shippingProfileResult[0];

    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
        name: "Global Warehouse delivery",
        type: "shipping",
        service_zones: [
            {
                name: "Europe",
                geo_zones: [
                    {
                        country_code: "gb",
                        type: "country",
                    },
                    {
                        country_code: "de",
                        type: "country",
                    },
                    {
                        country_code: "dk",
                        type: "country",
                    },
                    {
                        country_code: "se",
                        type: "country",
                    },
                    {
                        country_code: "fr",
                        type: "country",
                    },
                    {
                        country_code: "es",
                        type: "country",
                    },
                    {
                        country_code: "it",
                        type: "country",
                    },
                ],
            },
            {
                name: "Asia",
                geo_zones: [
                    {
                        country_code: "vn",
                        type: "country",
                    },
                    {
                        country_code: "kh",
                        type: "country",
                    },
                    {
                        country_code: "la",
                        type: "country",
                    },
                ],
            },
        ],
    });

    await remoteLink.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_set_id: fulfillmentSet.id,
        },
    });

    await createShippingOptionsWorkflow(container).run({
        input: [
            {
                name: "Standard Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Standard",
                    description: "Ship in 2-3 days.",
                    code: "standard",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 10,
                    },
                    {
                        currency_code: "eur",
                        amount: 10,
                    },
                    {
                        region_id: region.id,
                        amount: 10,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Express Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Express",
                    description: "Ship in 24 hours.",
                    code: "express",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 15,
                    },
                    {
                        currency_code: "eur",
                        amount: 15,
                    },
                    {
                        region_id: region.id,
                        amount: 15,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Standard Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[1].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Standard",
                    description: "Ship in 2-3 days.",
                    code: "standard",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 10,
                    },
                    {
                        currency_code: "eur",
                        amount: 10,
                    },
                    {
                        region_id: region.id,
                        amount: 10,
                    },
                    {
                        currency_code: "lak",
                        amount: 42000,
                    },
                    {
                        currency_code: "khr",
                        amount: 6000,
                    },
                    {
                        currency_code: "vnd",
                        amount: 30000,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Express Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[1].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Express",
                    description: "Ship in 24 hours.",
                    code: "express",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 15,
                    },
                    {
                        currency_code: "eur",
                        amount: 15,
                    },
                    {
                        region_id: region.id,
                        amount: 15,
                    },
                    {
                        currency_code: "lak",
                        amount: 55000,
                    },
                    {
                        currency_code: "khr",
                        amount: 8000,
                    },
                    {
                        currency_code: "vnd",
                        amount: 45000,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
        ],
    });
    logger.info("Finished seeding fulfillment data.");

    await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
            id: stockLocation.id,
            add: [defaultSalesChannel[0].id],
        },
    });
    logger.info("Finished seeding stock location data.");

    logger.info("Seeding publishable API key data...");
    const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
        container
    ).run({
        input: {
            api_keys: [
                {
                    title: "Webshop",
                    type: "publishable",
                    created_by: "",
                },
            ],
        },
    });
    const publishableApiKey = publishableApiKeyResult[0];

    await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
            id: publishableApiKey.id,
            add: [defaultSalesChannel[0].id],
        },
    });
    logger.info("Finished seeding publishable API key data.");

    logger.info("Seeding customer and admin data...");
    try {
        const { token: token_admin_1 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/user/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "21110785@student.hcmute.edu.vn",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_admin_1) {
            await createUserAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_admin_1).auth_identity_id}`,
                    userData: {
                        email: "21110785@student.hcmute.edu.vn",
                        first_name: "Mai Nguyen",
                        last_name: "Nhat Nam",
                    }
                }
            });
        }
        const { token: token_admin_2 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/user/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "21110762@student.hcmute.edu.vn",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_admin_2) {

            await createUserAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_admin_2).auth_identity_id}`,
                    userData: {
                        email: "21110762@student.hcmute.edu.vn",
                        first_name: "Cao",
                        last_name: "Thai Dat",
                    }
                }
            });
        }
        const { token: token_customer_1 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "nhatnam0192123@gmail.com",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_customer_1) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_1).auth_identity_id}`,
                    customerData: {
                        email: "nhatnam0192123@gmail.com",
                        first_name: "Hashkell",
                        last_name: "Hanksenberg",
                    }
                }
            });
        }
        const { token: token_customer_2 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "mnvn1ngan@gmail.com",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_customer_2) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_2).auth_identity_id}`,
                    customerData: {
                        email: "mnvn1ngan@gmail.com",
                        first_name: "Iroha",
                        last_name: "Jules",
                    }
                }
            });
        }
        const { token: token_customer_3 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user3@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_3) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_3).auth_identity_id}`,
                    customerData: {
                        email: "user3@example.com",
                        first_name: "Alice",
                        last_name: "Nguyen",
                    },
                },
            });
        }

        // Sample 4
        const { token: token_customer_4 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user4@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_4) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_4).auth_identity_id}`,
                    customerData: {
                        email: "user4@example.com",
                        first_name: "Bao",
                        last_name: "Tran",
                    },
                },
            });
        }

        // Sample 5
        const { token: token_customer_5 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user5@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_5) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_5).auth_identity_id}`,
                    customerData: {
                        email: "user5@example.com",
                        first_name: "Chi",
                        last_name: "Pham",
                    },
                },
            });
        }

        // Sample 6
        const { token: token_customer_6 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user6@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_6) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_6).auth_identity_id}`,
                    customerData: {
                        email: "user6@example.com",
                        first_name: "Dat",
                        last_name: "Le",
                    },
                },
            });
        }

        // Sample 7
        const { token: token_customer_7 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user7@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_7) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_7).auth_identity_id}`,
                    customerData: {
                        email: "user7@example.com",
                        first_name: "Emi",
                        last_name: "Nguyen",
                    },
                },
            });
        }

        // Sample 8
        const { token: token_customer_8 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user8@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_8) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_8).auth_identity_id}`,
                    customerData: {
                        email: "user8@example.com",
                        first_name: "Phong",
                        last_name: "Do",
                    },
                },
            });
        }

        // Sample 9
        const { token: token_customer_9 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user9@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_9) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_9).auth_identity_id}`,
                    customerData: {
                        email: "user9@example.com",
                        first_name: "Giang",
                        last_name: "Bui",
                    },
                },
            });
        }

        // Sample 10
        const { token: token_customer_10 } = await fetch(`${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user10@example.com", password: commonPassword }),
        }).then(res => res.json());

        if (token_customer_10) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    //@ts-ignore
                    authIdentityId: `${jwtDecode(token_customer_10).auth_identity_id}`,
                    customerData: {
                        email: "user10@example.com",
                        first_name: "Ha",
                        last_name: "Dang",
                    },
                },
            });
        }
    } catch (error: any) {
        logger.error(error.toString())
    }

    logger.info("Finished seeding customer and admin data.");

    logger.info("Seeding product data...");

    const {
        result: [collection],
    } = await createCollectionsWorkflow(container).run({
        input: {
            collections: [
                {
                    title: "Recently added",
                    handle: "recently-added",
                },
            ],
        },
    });

    const { result: categoryResult } = await createProductCategoriesWorkflow(
        container
    ).run({
        input: {
            product_categories: [
                {
                    name: "Consoles",
                    is_active: true,
                },
                {
                    name: "Games",
                    is_active: true,
                },
                {
                    name: "Accessories",
                    is_active: true,
                }

            ],
        },
    });

    const { result: accessoriesResult } = await createProductCategoriesWorkflow(container).run({
        input: {
            product_categories: [
                {
                    name: "Controllers",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Accessories")?.id,
                },
                {
                    name: "Cables & networking",
                    handle: "cables-and-networking",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Accessories")?.id,
                },
                {
                    name: "Mobile gaming accessories",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Accessories")?.id,
                },

            ],
        },
    })

    const { result: gameCategoryResult } = await createProductCategoriesWorkflow(
        container
    ).run({
        input: {
            product_categories: [
                {
                    name: "Action & adventure",
                    handle: "action-and-adventure",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Card & board",
                    handle: "card-and-board",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Family & kids",
                    handle: "family-and-kids",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Fighting",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Strategy",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Sport",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Racing & flying",
                    handle: "racing-and-flying",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Puzzle & trivia",
                    handle: "puzzle-and-trivia",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Shooter",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Simulationn",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Role-Playing",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Platformer",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
                {
                    name: "Other",
                    is_active: true,
                    parent_category_id: categoryResult.find((cat) => cat.name === "Games")?.id,
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Clair Obscur: Expedition 33",
                    subtitle: "Sandfall Interactive / Kepler Interactive",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Role-Playing")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                    ],
                    description:
                        "Clair Obscur: Expedition 33 is a turn-based RPG set in a dark fantasy Belle Époque world. Join the members of Expedition 33 as they embark on a mission to defeat the Paintress and end the cycle of the Gommage. Experience a blend of traditional turn-based mechanics with real-time elements, including dodging, parrying, and free-aim attacks.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.55260.14322280443288156.27788484-2760-47f7-be0d-dd693682e016.c7b2322a-d6b0-4051-a58b-d0b11aa37b20?w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.8446.13948953044661892.bf924ec5-6290-45c9-938a-120201a3c887.14c2eee2-6758-48a1-8e76-0e3c21ebe0e8?q=90&w=400",
                        },
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Deluxe Edition"],
                        },
                    ],
                    variants: [
                        {
                            title: "Clair Obscur: Expedition 33 - Standard Edition",
                            sku: "CLAIR-OBSCUR-STANDARD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 49.99, currency_code: "usd" },
                                { amount: 1150000, currency_code: "vnd" },
                                { amount: 45.99, currency_code: "eur" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 1250000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Clair Obscur: Expedition 33 - Deluxe Edition",
                            sku: "CLAIR-OBSCUR-DELUXE",
                            manage_inventory: true,
                            options: {
                                Edition: "Deluxe Edition",
                            },
                            prices: [
                                { amount: 59.99, currency_code: "usd" },
                                { amount: 1350000, currency_code: "vnd" },
                                { amount: 55.99, currency_code: "eur" },
                                { amount: 135000, currency_code: "khr" },
                                { amount: 1450000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Developer": "Sandfall Interactive",
                        "Publisher": "Kepler Interactive",
                        "Release Date": "April 24, 2025",
                        "Genres": "Turn-based RPG, Adventure",
                        "Modes": "Single-player",
                        "Platforms": "Xbox Series X|S, PlayStation 5, Windows PC",
                        "Engine": "Unreal Engine 5",
                        "Deluxe Edition Content": "Includes 'Flowers' Collection (six outfits and hairstyles), 'Clair' outfit for Maelle, and 'Obscur' outfit for Gustave.",
                    },
                },
            ],
        },
    });


    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title:
                        'Road 96',
                    subtitle: "DigixArt",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Road 96 is a crazy, beautiful road- trip. The discovery of exciting places, and unusual people on your own personal journey to freedom.\nAn ever - evolving story - driven adventure inspired by Tarantino, The Coen Brothers, and Bong Joon - ho. Made by the award - winning creators of Valiant Hearts and Memories Retold. Moments of action, exploration, contemplative melancholy, human encounters and wacky situations. Set against a backdrop of authoritarian rule and oppression. \nA stunning visual style, a soundtrack filled with 90s hits, and a thousand routes through the game combine so each player can create their own unique stories on Road 96.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Deluxe"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.33921.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.32c2bc03-fbaf-42e2-8326-1e68d22fa8ea",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.10395.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.b0c89347-5959-42b3-9b86-1fba086f8b31",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.8388.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.bc9278fa-5e52-4fc5-821e-fb006cdf0d43",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.42930.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.af2e13e6-3824-43f9-b62b-e92a2f476bbf",
                        },
                    ],
                    variants: [
                        {
                            title: "New Normal",
                            sku: "NEW-NORMAL-STANDARD",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 18,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 509700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 82000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 431800,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 19.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Standard",
                            },
                        },
                        {
                            title: "New Normal",
                            sku: "NEW-NORMAL-DELUXE",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 20,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 560700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 90200,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 475000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 21.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Deluxe",
                            },
                        },
                        {
                            title: "Mile 0",
                            sku: "MILE-0",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 12,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 331200,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 53300,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 280600,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 12.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Standard",
                            },
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "OS": "Windows 10 version 18362.0 or higher",
                        "Architecture": "x64",
                        "Graphics": "NVIDIA RTX 2060 Super or RX 5700XT",
                        "Processor": "Intel Core i5 8600K or AMD Ryzen 5 3600XT",
                        "Keyboard": "Integrated Keyboard",
                        "Mouse": "Integrated Mouse",
                        "Controller": "Xbox controller or gamepad",
                        "DirectX": "Version 11",
                        "Memory": "16 GB",
                        "Video Memory": "6 GB",
                    }

                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Hogwarts Legacy",
                    subtitle: "Portkey Games",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Role-Playing")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                    ],
                    description:
                        "Experience the magic of the wizarding world in 'Hogwarts Legacy', an open-world RPG set in the 1800s. Attend classes, learn spells, and uncover hidden secrets as you embark on a journey through Hogwarts and beyond.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Xbox Edtion", "Digital Deluxe Edition", "XBOX One version"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.6642.13814785456466922.0fef76f8-710d-4aca-b42f-c45e536f8d2b.012a86fe-8506-4e46-8e5a-1ec47e011f62?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.64128.13853283465555502.df9a42b7-95ee-4088-89b3-08a50204f8ef.da71d8cf-7bb7-4f0d-a0e0-9df90aba8b88?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.36022.13814785456466922.4e78e496-4e8c-4f2c-93df-55ea1fa48e05.5871650b-f682-48cc-a882-c003b9d1f725",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.41433.13814785456466922.4e78e496-4e8c-4f2c-93df-55ea1fa48e05.4c5291b0-6136-471a-8310-39bb68e2b5d7"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.47428.13814785456466922.4e78e496-4e8c-4f2c-93df-55ea1fa48e05.da5c7706-5acb-4de4-83ed-99118cfa6f37"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.3724.13814785456466922.4e78e496-4e8c-4f2c-93df-55ea1fa48e05.91f899c8-947c-446d-9be8-4034b3a566d2"
                        }
                    ],
                    variants: [
                        {
                            title: "Hogwarts Legacy Xbox Series X|S",
                            sku: "HOGWARTS-LEGACY-XBOX",
                            manage_inventory: true,
                            prices: [
                                { amount: 69.99, currency_code: "usd" },
                                { amount: 1650000, currency_code: "vnd" },
                                { amount: 65, currency_code: "eur" },
                            ],
                            options: {
                                Edition: "Xbox Edtion",
                            },
                        },
                        {
                            title: "Hogwarts Legacy Digital Deluxe Edition",
                            sku: "HOGWARTS-LEGACY-DELUXE",
                            manage_inventory: true,
                            prices: [
                                { amount: 79.99, currency_code: "usd" },
                                { amount: 1900000, currency_code: "vnd" },
                                { amount: 70, currency_code: "eur" },
                            ],
                            options: {
                                Edition: "Digital Deluxe Edition",
                            },
                        },
                        {
                            title: "Hogwarts Legacy Xbox One",
                            sku: "HOGWARTS-LEGACY-XBOX-ONE",
                            manage_inventory: true,
                            prices: [
                                { amount: 59.99, currency_code: "usd" },
                                { amount: 1400000, currency_code: "vnd" },
                                { amount: 55, currency_code: "eur" },
                            ],
                            options: {
                                Edition: "XBOX One version",
                            },
                        }
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Platform": "Multi-platform",
                        "Genre": "Action RPG",
                        "Mode": "Single-player",
                        "Developer": "Portkey Games",
                        "Publisher": "Warner Bros. Interactive Entertainment",
                        "Release Date": "February 10, 2023",
                        "ESRB": "Teen",
                    },
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "DOOM: The Dark Ages",
                    subtitle: "id Software / Bethesda Softworks",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Shooter")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "DOOM: The Dark Ages is a dark fantasy/sci-fi single-player experience that delivers the searing combat and over-the-top visuals of the incomparable DOOM franchise. Powered by the latest idTech engine, this prequel to DOOM (2016) and DOOM Eternal tells the epic cinematic origin story of the DOOM Slayer’s rage. Players will step into the blood-stained boots of the DOOM Slayer in a never-before-seen dark and sinister medieval war against Hell.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.47432.14239344665439398.f72b7e9e-0a95-4e76-b1e3-8989c4d70e2e.c8545c7d-a8d3-4853-b09f-25a680a145ad?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.3479.13728467728881069.7404643f-07f2-4d25-9b69-7abe8564d7a4.b698a66e-f570-4850-b9b9-1a6e68ca5bbd?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.15478.13728467728881069.7404643f-07f2-4d25-9b69-7abe8564d7a4.f4b54635-cd06-4051-b2aa-c83f1e486d93"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.59998.13728467728881069.7404643f-07f2-4d25-9b69-7abe8564d7a4.6c84f55f-6795-41be-b05d-33791a35167e"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.50698.13728467728881069.7404643f-07f2-4d25-9b69-7abe8564d7a4.dff8572a-b180-4cf0-92a1-c3e3b98264b3"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.47290.13728467728881069.7404643f-07f2-4d25-9b69-7abe8564d7a4.b31a80d3-7eab-469a-8ae6-6feadae16530"
                        }
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Premium", "Collector's Bundle"],
                        },
                    ],
                    variants: [
                        {
                            title: "DOOM: The Dark Ages - Standard Edition",
                            sku: "DOOM-DARK-STD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 69.99, currency_code: "usd" },
                                { amount: 1150000, currency_code: "vnd" },
                                { amount: 79.99, currency_code: "eur" },
                                { amount: 95000, currency_code: "khr" },
                                { amount: 430000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "DOOM: The Dark Ages - Premium Edition",
                            sku: "DOOM-DARK-PREM",
                            manage_inventory: true,
                            options: {
                                Edition: "Premium",
                            },
                            prices: [
                                { amount: 89.99, currency_code: "usd" },
                                { amount: 1450000, currency_code: "vnd" },
                                { amount: 99.99, currency_code: "eur" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 560000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "DOOM: The Dark Ages - Collector's Bundle",
                            sku: "DOOM-DARK-COLL",
                            manage_inventory: true,
                            options: {
                                Edition: "Collector's Bundle",
                            },
                            prices: [
                                { amount: 119.99, currency_code: "usd" },
                                { amount: 1900000, currency_code: "vnd" },
                                { amount: 129.99, currency_code: "eur" },
                                { amount: 135000, currency_code: "khr" },
                                { amount: 690000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Developer": "id Software",
                        "Publisher": "Bethesda Softworks",
                        "Release Date": "May 15, 2025",
                        "Genres": "First-Person Shooter, Action",
                        "Modes": "Single-player",
                        "Platforms": "Xbox Series X|S, PlayStation 5, Windows PC",
                        "Engine": "idTech",
                        "Features": "Medieval setting, Shield mechanics, Dragon riding, Mech battles",
                        "Premium Edition Content": "Includes early access, exclusive skins, and additional in-game content.",
                        "Collector's Bundle Content": "Includes Premium content plus physical collectibles and limited-edition items.",
                    },
                },
            ],
        },
    });



    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "The Adventure of Ori",
                    subtitle: "Moon Studios",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Platformer")?.id!,

                    ],
                    description:
                        "The Adventure of Ori is a visually stunning platformer that delivers a deeply emotional story, challenging puzzles, and fluid combat. Embark on an epic journey through a mystical world filled with wonder and danger.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Ori and the Blind Forest", "Ori and the Will of the Wisps"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.15568.14566546603801090.bfdd0400-3c33-4fef-8e32-472bcf6c08e6.6b963e3d-c91e-4e13-ab1e-71281d281559",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.7767.14566546603801090.bfdd0400-3c33-4fef-8e32-472bcf6c08e6.91d25cc7-4edd-4a75-b85b-f5f704636066",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.28996.14566546603801090.bfdd0400-3c33-4fef-8e32-472bcf6c08e6.891a1e15-cfab-4abb-b401-1ba50010afb7",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.64172.14566546603801090.bfdd0400-3c33-4fef-8e32-472bcf6c08e6.97db0d31-a760-4f89-864f-65f391b5d4f3",
                        },
                    ],
                    variants: [
                        {
                            title: "Ori and the Will of the Wisps",
                            sku: "ORI-WILL-OF-THE-WISPS",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 25,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 710000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 115000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 600000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 29.99,
                                    currency_code: "usd",
                                },
                            ],
                            options: {
                                Edition: "Ori and the Will of the Wisps",
                            },
                        },
                        {
                            title: "Ori and the Blind Forest",
                            sku: "ORI-BLIND-FOREST",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 30,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 850000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 137000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 700000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 34.99,
                                    currency_code: "usd",
                                },
                            ],
                            options: {
                                Edition: "Ori and the Blind Forest",
                            },
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Architecture": "x64",
                        "Graphics": "NVIDIA® GeForce® GTX 660 / AMD Radeon™ R9 280 (3GB or more VRAM)",
                        "Processor": "Intel® Core™ i7 / AMD FX-8350",
                        "Keyboard": "Integrated Keyboard",
                        "Mouse": "Integrated Mouse",
                        "Controller": "gamepad",
                        "Memory": "8 GB",
                        "Also can play with": "PlayStation 5, Nintendo Switch"
                    }
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Battlefield V",
                    subtitle: "DICE / Electronic Arts",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Shooter")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Experience the ultimate Battlefield V experience. Enter mankind’s greatest conflict with the complete arsenal of weapons, vehicles, and gadgets plus the best customization content of Year 1 and 2.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.10903.13990191027854846.0c760294-e5d0-447a-84a2-8b9c4c3cfe9b.3da9e2c5-0551-4f12-93b7-dc51d28812ec?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.21143.13990191027854846.0c760294-e5d0-447a-84a2-8b9c4c3cfe9b.e0524336-9a02-4e65-accf-85efb41316a7",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.36958.13990191027854846.0c760294-e5d0-447a-84a2-8b9c4c3cfe9b.989df8db-8c68-4c5c-9c16-30222d367d03"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.58029.13990191027854846.0c760294-e5d0-447a-84a2-8b9c4c3cfe9b.9eb409cf-1aea-43f6-bfe7-af2a5413cbac"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.44580.13990191027854846.0c760294-e5d0-447a-84a2-8b9c4c3cfe9b.551591e9-a39e-4b61-b850-02f3e9b9d6f4"
                        }
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Definitive"],
                        },
                    ],
                    variants: [
                        {
                            title: "Battlefield V - Standard Edition",
                            sku: "BFV-STD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 59.99, currency_code: "usd" },
                                { amount: 1390000, currency_code: "vnd" },
                                { amount: 49.99, currency_code: "eur" },
                                { amount: 135000, currency_code: "khr" },
                                { amount: 1450000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Battlefield V - Definitive Edition",
                            sku: "BFV-DEF",
                            manage_inventory: true,
                            options: {
                                Edition: "Definitive",
                            },
                            prices: [
                                { amount: 69.99, currency_code: "usd" },
                                { amount: 1600000, currency_code: "vnd" },
                                { amount: 59.99, currency_code: "eur" },
                                { amount: 155000, currency_code: "khr" },
                                { amount: 1650000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Developer": "DICE",
                        "Publisher": "Electronic Arts",
                        "Release Date": "October 22, 2020",
                        "Genres": "First-Person Shooter, Action",
                        "Modes": "Single-player, Multiplayer",
                        "Platforms": "Xbox One, Xbox Series X|S",
                        "Features": "All gameplay content from launch, Year 1, and Year 2; All Elites; 84 immersive outfit variations; 8 soldier outfits from Year 2; 2 weapon skins from Year 2; 3 vehicle dressings; 33 Chapter Reward items from Year 1.",
                    },
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Need for Speed™ Heat",
                    subtitle: "Ghost Games / Electronic Arts",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Racing & flying")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Hustle by day and risk it all at night in Need for Speed™ Heat, a thrilling race experience that pits you against a city's rogue police force as you battle your way into street racing's elite. The Deluxe Edition includes exclusive cars, character outfits, and in-game boosts to enhance your experience.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.26776.69435230515002378.477c7a96-5d17-45ec-95c2-a2739146b68d.b0d37a76-e4fa-495e-abac-6697ee4b5887?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.42918.69435230515002378.af86836f-c697-4e65-bba8-ba1d504754e2.b346274f-0206-45a5-af4c-d2e0a6b74828",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.1999.69435230515002378.af86836f-c697-4e65-bba8-ba1d504754e2.23624171-d12d-461d-9b8e-a1ad05a52695?w=1000"

                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.2950.69435230515002378.af86836f-c697-4e65-bba8-ba1d504754e2.5eb03e35-4bc5-4d8b-9987-ec524e03ae85?w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.8628.69435230515002378.af86836f-c697-4e65-bba8-ba1d504754e2.0323adae-13d7-4681-8a9c-627ed20e57e0?w=1000"
                        }

                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Deluxe"],
                        },
                    ],
                    variants: [
                        {
                            title: "Need for Speed™ Heat - Standard Edition",
                            sku: "NFS-HEAT-STD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 59.99, currency_code: "usd" },
                                { amount: 1390000, currency_code: "vnd" },
                                { amount: 49.99, currency_code: "eur" },
                                { amount: 135000, currency_code: "khr" },
                                { amount: 1450000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Need for Speed™ Heat - Deluxe Edition",
                            sku: "NFS-HEAT-DELUXE",
                            manage_inventory: true,
                            options: {
                                Edition: "Deluxe",
                            },
                            prices: [
                                { amount: 69.99, currency_code: "usd" },
                                { amount: 1600000, currency_code: "vnd" },
                                { amount: 59.99, currency_code: "eur" },
                                { amount: 155000, currency_code: "khr" },
                                { amount: 1650000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Developer": "Ghost Games",
                        "Publisher": "Electronic Arts",
                        "Release Date": "November 8, 2019",
                        "Genres": "Racing, Action",
                        "Modes": "Single-player, Multiplayer",
                        "Platforms": "Xbox One, Xbox Series X|S",
                        "Features": "Open-world racing, Day/Night cycle, Customization",
                        "Deluxe Edition Content": "K.S Edition Mitsubishi Lancer Evolution X Starter Car, Exclusive wrap, 3 additional K.S Edition cars unlocked through progression, 4 exclusive character outfits, REP and BANK boost",
                    },
                },
            ],
        },
    });


    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Cassette Beasts",
                    subtitle: "Bytten Studio",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Role-Playing")?.id!,
                    ],
                    description:
                        "Cassette Beasts is a retro-inspired monster-fusing RPG where you collect and fuse creatures recorded on cassette tapes. Explore the open-world island of New Wirral, solve puzzles, and fight monsters in turn-based battles.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Deluxe Edition", "New Wirral Edition"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.32760.14053398568595271.6df710ab-5b0b-4a3d-8691-4e7b0afae807.9b2a78ee-482b-43a9-bb0a-5d90279fb438?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.30772.14053398568595271.407ffc50-6e9a-482e-8241-426da744896c.91513a84-e5bf-4fea-8609-331549a90a43",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.53869.14053398568595271.407ffc50-6e9a-482e-8241-426da744896c.a3533cc6-7e06-4573-848c-52187897f632"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.49634.14053398568595271.407ffc50-6e9a-482e-8241-426da744896c.483734d6-b972-493b-8d2d-4782e95c1757"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.14696.14053398568595271.407ffc50-6e9a-482e-8241-426da744896c.152ed0fe-cf2f-45c5-9407-5dc71aca8703"
                        }
                    ],
                    variants: [
                        {
                            title: "Cassette Beasts - Standard Edition",
                            sku: "CASSETTE-STANDARD",
                            manage_inventory: true,
                            prices: [
                                { amount: 20, currency_code: "eur" },
                                { amount: 500000, currency_code: "vnd" },
                                { amount: 95000, currency_code: "khr" },
                                { amount: 430000, currency_code: "lak" },
                                { amount: 19.99, currency_code: "usd" },
                            ],
                            options: {
                                Edition: "Standard",
                            },
                        },
                        {
                            title: "Cassette Beasts - Deluxe Edition",
                            sku: "CASSETTE-DELUXE",
                            manage_inventory: true,
                            prices: [
                                { amount: 25, currency_code: "eur" },
                                { amount: 650000, currency_code: "vnd" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 560000, currency_code: "lak" },
                                { amount: 24.99, currency_code: "usd" },
                            ],
                            options: {
                                Edition: "Deluxe Edition",
                            },
                        },
                        {
                            title: "Cassette Beasts - New Wirral Edition",
                            sku: "CASSETTE-WIRRAL",
                            manage_inventory: true,
                            prices: [
                                { amount: 30, currency_code: "eur" },
                                { amount: 800000, currency_code: "vnd" },
                                { amount: 135000, currency_code: "khr" },
                                { amount: 690000, currency_code: "lak" },
                                { amount: 29.99, currency_code: "usd" },
                            ],
                            options: {
                                Edition: "New Wirral Edition",
                            },
                        },
                    ],
                    sales_channels: [
                        { id: defaultSalesChannel[0].id },
                    ],
                    metadata: {
                        "Platform": "Xbox Series X|S, PC",
                        "Genre": "Indie, RPG, Adventure",
                        "Developer": "Bytten Studio",
                        "Publisher": "Raw Fury",
                        "Release Date": "April 26, 2023",
                        "Editions": "Standard, Deluxe, New Wirral",
                    },
                },
            ],
        },
    });



    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Minecraft",
                    subtitle: "Mojang",
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Family & kids")?.id!,
                    ],
                    description:
                        "Minecraft is a sandbox game that empowers creativity and exploration. Build, mine, and survive in a procedurally generated world, offering endless adventures in both single-player and multiplayer modes.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Deluxe Collection", "Dungeons", "Legends"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.26021.14601968722510098.29802ab2-a3be-4af1-b487-390de5a77b50.c9f485c6-df88-449a-8536-4e5eec5b6198",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.37950.14601968722510098.29802ab2-a3be-4af1-b487-390de5a77b50.1ac5e459-3b2a-4634-b7c7-46256edfc408",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.63804.14601968722510098.29802ab2-a3be-4af1-b487-390de5a77b50.9aea7af8-f8d9-4add-bab4-d8b003bfdf2f",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.63804.14601968722510098.29802ab2-a3be-4af1-b487-390de5a77b50.9aea7af8-f8d9-4add-bab4-d8b003bfdf2f",
                        },
                    ],
                    variants: [
                        {
                            title: "Minecraft - Deluxe Collection",
                            sku: "MINECRAFT-DELUXE",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 26,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 740000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 120000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 630000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 29.99,
                                    currency_code: "usd",
                                },
                            ],
                            options: {
                                Edition: "Deluxe Collection",
                            },
                        },
                        {
                            title: "Minecraft Dungeons",
                            sku: "MINECRAFT-DUNGEONS",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 30,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 850000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 138000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 700000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 34.99,
                                    currency_code: "usd",
                                },
                            ],
                            options: {
                                Edition: "Dungeons",
                            },
                        },
                        {
                            title: "Minecraft Legends",
                            sku: "MINECRAFT-LEGENDS",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 35,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 1000000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 160000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 850000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 39.99,
                                    currency_code: "usd",
                                },
                            ],
                            options: {
                                Edition: "Legends",
                            },
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Architecture": "x64",
                        "Graphics": "NVIDIA® GeForce® GTX 630 / AMD Radeon™ R9 280 (3GB or more VRAM)",
                        "Processor": "Intel® Core™ i5 / AMD FX-8350",
                        "Keyboard": "Integrated Keyboard",
                        "Mouse": "Integrated Mouse",
                        "Memory": "8 GB",
                        "Also can play with": "Xbox One, Xbox Series X|S, Xbox Cloud Gaming, PlayStation 4, PlayStation 5, Nintendo Switch"

                    }
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "UNO™",
                    subtitle: "Ubisoft",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Card & board")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Play the classic UNO™ card game with friends and family or online with new editions offering fresh visuals and game modes. From the Legacy to the Ultimate Edition, enjoy endless card action!",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.64833.67582047191807640.1f6942f5-d7bc-46df-a9db-2fa15b28dfdf.7d799b05-0ec4-4758-92ac-c4152b49db91?q=90&w=400",

                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.30625.67582047191807640.1f6942f5-d7bc-46df-a9db-2fa15b28dfdf.c1e4ab78-6cf0-441b-877d-20f79d279085?w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.7132.67582047191807640.1f6942f5-d7bc-46df-a9db-2fa15b28dfdf.c3509c86-6e37-48fb-905f-283d8c7bb15b?w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.60086.67582047191807640.1f6942f5-d7bc-46df-a9db-2fa15b28dfdf.85722dd4-2f10-4383-8f99-354a47a5ee4c?q=90&w=1000"
                        },
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: [
                                "Standard (Ubisoft+)",
                                "Legacy Edition",
                                "Ultimate Edition (Ubisoft+)",
                                "Ultimate Edition",
                            ],
                        },
                    ],
                    variants: [
                        {
                            title: "UNO™ – Standard (Ubisoft+)",
                            sku: "UNO-STANDARD-UBI",
                            manage_inventory: false,
                            prices: [],
                            options: {
                                Edition: "Standard (Ubisoft+)",
                            },
                        },
                        {
                            title: "UNO™ Legacy Edition",
                            sku: "UNO-LEGACY",
                            manage_inventory: true,
                            prices: [
                                { amount: 19.99, currency_code: "usd" },
                                { amount: 475000, currency_code: "vnd" },
                                { amount: 18, currency_code: "eur" },
                            ],
                            options: {
                                Edition: "Legacy Edition",
                            },
                        },
                        {
                            title: "UNO™ Ultimate Edition (Ubisoft+)",
                            sku: "UNO-ULTIMATE-UBI",
                            manage_inventory: false,
                            prices: [],
                            options: {
                                Edition: "Ultimate Edition (Ubisoft+)",
                            },
                        },
                        {
                            title: "UNO® Ultimate Edition",
                            sku: "UNO-ULTIMATE",
                            manage_inventory: true,
                            prices: [
                                { amount: 24.99, currency_code: "usd" },
                                { amount: 590000, currency_code: "vnd" },
                                { amount: 22.99, currency_code: "eur" },
                            ],
                            options: {
                                Edition: "Ultimate Edition",
                            },
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        Developer: "Ubisoft",
                        Publisher: "Ubisoft",
                        Genres: "Card & Board, Family",
                        Platforms: "Xbox One, Xbox Series X|S",
                        Modes: "Single-player, Multiplayer",
                        "Included with Ubisoft+": "Yes (Standard and Ultimate Edition)",
                        "Release Date": "August 15, 2016",
                    },
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Chess Royal",
                    subtitle: "Silesia Games / Inlogic Software",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Card & board")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Strategy")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Chess Royal offers a classic chess experience enhanced with powerful AI, local multiplayer, and a vast array of puzzles. Perfect for both beginners and seasoned players.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.5951.14261777150440352.5e7a2353-4f84-4177-8616-a91d09a44d4c.350c7228-077c-4597-93d7-47d8450053e4?w=400",

                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.21572.14261777150440352.5e7a2353-4f84-4177-8616-a91d09a44d4c.e873696a-3957-4198-a337-5e58f73b1552?q=90&w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.11307.14261777150440352.5e7a2353-4f84-4177-8616-a91d09a44d4c.bc5f7b0e-9b47-4e26-871c-df3c69a90258?q=90&w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.64729.14261777150440352.5e7a2353-4f84-4177-8616-a91d09a44d4c.860889bd-07d7-4b2e-ab38-2b29269d08f9?q=90&w=1000"
                        }
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard"],
                        },
                    ],
                    variants: [
                        {
                            title: "Chess Royal - Standard Edition",
                            sku: "CHESS-ROYAL-STD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 2.99, currency_code: "usd" },
                                { amount: 69000, currency_code: "vnd" },
                                { amount: 2.49, currency_code: "eur" },
                                { amount: 7000, currency_code: "khr" },
                                { amount: 30000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        Developer: "Inlogic Software s.r.o.",
                        Publisher: "Silesia Games Sp. z o.o.",
                        "Release Date": "August 23, 2023",
                        Genres: "Card & Board, Strategy",
                        Modes: "Single-player, Local Multiplayer",
                        Platforms: "Xbox One, Xbox Series X|S, PC",
                        Features:
                            "Powerful AI, Local Multiplayer, Extensive Puzzle Collection, Daily Challenges, Xbox Play Anywhere",
                    },
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "It Takes Two",
                    subtitle: "Hazelight Studios / Electronic Arts",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Action & adventure")?.id!,
                        gameCategoryResult.find((cat) => cat.name === "Platformer")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Embark on the craziest journey of your life in It Takes Two, a genre-bending co-op adventure created purely for two. Invite a friend to join for free with Friend’s Pass and work together across a huge variety of gleefully disruptive gameplay challenges.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.1758.14488339386131194.84ca8b8a-582e-4d34-904e-8f1e60f71000.21ae50f4-b3e8-491b-b7f9-a78676a40b42?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.63017.14488339386131194.8bc5d978-7a06-47eb-8c51-ddc2799fc01e.d7d18fab-077a-4d41-ad16-3c0a9883428b?q=90&w=1000",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.48703.14488339386131194.8bc5d978-7a06-47eb-8c51-ddc2799fc01e.07e6a5f6-b0e7-47aa-a06e-c67c6dea578f?q=90&w=1000",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.48703.14488339386131194.8bc5d978-7a06-47eb-8c51-ddc2799fc01e.07e6a5f6-b0e7-47aa-a06e-c67c6dea578f?q=90&w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.54692.14488339386131194.84ca8b8a-582e-4d34-904e-8f1e60f71000.e50f74bc-567d-47a5-aea7-e1562cb0bb4a?q=90&w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.43400.14488339386131194.84ca8b8a-582e-4d34-904e-8f1e60f71000.b62d6540-8486-4a0e-b701-8bd9355744e8?q=90&w=1000"
                        }
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Digital Version", "Hazelight Bundle"],
                        },
                    ],
                    variants: [

                        {
                            title: "It Takes Two – Digital Version",
                            sku: "ITTAKES2-DIGITAL",
                            manage_inventory: true,
                            options: {
                                Edition: "Digital Version",
                            },
                            prices: [
                                { amount: 13.99, currency_code: "usd" },
                                { amount: 320000, currency_code: "vnd" },
                                { amount: 12.49, currency_code: "eur" },
                            ],
                        },
                        {
                            title: "Hazelight Bundle",
                            sku: "HAZELIGHT-BUNDLE",
                            manage_inventory: true,
                            options: {
                                Edition: "Hazelight Bundle",
                            },
                            prices: [
                                { amount: 17.99, currency_code: "usd" },
                                { amount: 420000, currency_code: "vnd" },
                                { amount: 15.99, currency_code: "eur" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        Developer: "Hazelight Studios",
                        Publisher: "Electronic Arts",
                        "Release Date": "March 26, 2021",
                        Genres: "Action & Adventure, Platformer",
                        Modes: "Online Co-op, Local Co-op",
                        Platforms: "Xbox One, Xbox Series X|S",
                        Features:
                            "Smart Delivery, Friend's Pass, Split-screen play, Genre-bending gameplay",
                    },
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Mortal Kombat 11",
                    subtitle: "NetherRealm Studios / Warner Bros. Games",
                    collection_id: collection.id,
                    category_ids: [
                        gameCategoryResult.find((cat) => cat.name === "Fighting")?.id!,
                        categoryResult.find((cat) => cat.name === "Games")?.id!,
                    ],
                    description:
                        "Mortal Kombat 11 is the latest installment in the critically acclaimed franchise, providing a deeper and more personalized experience than ever before. The all-new Custom Character Variations give you unprecedented control of your fighters to make them your own. Featuring a roster of new and returning Klassic Fighters, Mortal Kombat's best-in-class cinematic story mode continues the epic saga over 25 years in the making. Players take on the role of a variety of past and present characters in a time-bending new narrative that pits Raiden against Kronika, the Keeper of Time. Packed to the brim with multiple modes, including the Towers of Time, allowing players to test their skills through various challenges, providing more ways than ever to continue the Mortal Kombat 11 experience.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.9688.70804610839547354.8da93c46-fd13-4b16-8ebe-e8e02c53d93e.09c2e91e-28bd-4f6f-bfd6-79d6b241667a?q=90&w=400",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.2033.70804610839547354.9477ad2f-9923-4911-b74d-5ed9c834af4a.2d887faf-426e-40ac-9cb4-62ee2f99fb94?q=90&w=1000"
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.22804.70804610839547354.9477ad2f-9923-4911-b74d-5ed9c834af4a.c136c2ff-9144-4e20-b8e9-68dcd017f17d?q=90&w=1000",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.22804.70804610839547354.9477ad2f-9923-4911-b74d-5ed9c834af4a.c136c2ff-9144-4e20-b8e9-68dcd017f17d?q=90&w=1000",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.56713.70804610839547354.8da93c46-fd13-4b16-8ebe-e8e02c53d93e.c876a52d-d1a6-4117-b88e-313e1ef2bac2?q=90&w=1000",
                        }
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Ultimate"],
                        },
                    ],
                    variants: [
                        {
                            title: "Mortal Kombat 11 – Standard Edition",
                            sku: "MK11-STD",
                            manage_inventory: true,
                            options: {
                                Edition: "Standard",
                            },
                            prices: [
                                { amount: 49.99, currency_code: "usd" },
                                { amount: 1190000, currency_code: "vnd" },
                                { amount: 44.99, currency_code: "eur" },
                                { amount: 9000, currency_code: "khr" },
                                { amount: 40000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Mortal Kombat 11 – Ultimate Edition",
                            sku: "MK11-ULT",
                            manage_inventory: true,
                            options: {
                                Edition: "Ultimate",
                            },
                            prices: [
                                { amount: 59.99, currency_code: "usd" },
                                { amount: 1420000, currency_code: "vnd" },
                                { amount: 54.99, currency_code: "eur" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        Developer: "NetherRealm Studios",
                        Publisher: "Warner Bros. Games",
                        "Release Date": "April 23, 2019",
                        Genres: "Fighting, Action",
                        Modes: "Single-player, Online Multiplayer, Local Multiplayer",
                        Platforms: "Xbox One, Xbox Series X|S",
                        Features:
                            "Custom Character Variations, Cinematic Story Mode, Towers of Time, Smart Delivery, Xbox Play Anywhere",
                    },
                },
            ],
        },
    });



    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "XBOX Series X",
                    subtitle: "Microsoft",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Consoles")?.id!,
                    ],
                    description:
                        "Xbox Series X, the fastest, most powerful Xbox ever. Explore rich new worlds with 12 teraflops of raw graphic processing power, DirectX ray tracing, a custom SSD, and 4K gaming. Make the most of every gaming minute with Quick Resume, lightning-fast load times, and gameplay of up to 120 FPS—all powered by Xbox Velocity Architecture. Enjoy thousands of games from four generations of Xbox, with hundreds of optimized titles that look and play better than ever. And when you add Xbox Game Pass Ultimate (membership sold separately), you get online multiplayer to play with friends and an instant library of 100+ high-quality games, including day one releases from Xbox Game Studios.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://cms-assets.xboxservices.com/assets/bc/40/bc40fdf3-85a6-4c36-af92-dca2d36fc7e5.png?n=642227_Hero-Gallery-0_A1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/14/b5/14b5af73-466f-4584-9c7c-de5464af8c3b.png?n=642227_Hero-Gallery-0_A3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/c5/30/c53042dc-6a60-43f7-b1ff-0b4e018edbbe.png?n=642227_Hero-Gallery-0_A4_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/5c/5b/5c5bf348-d948-4c48-b7cc-55aaf94f2782.png?n=642227_Hero-Gallery-0_B1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/63/5d/635d513d-a5b0-46e3-a665-97dede478295.png?n=642227_Hero-Gallery-0_B3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/df/d1/dfd18a77-3b9e-4550-b9fb-1784171b7353.png?n=642227_Hero-Gallery-0_B4_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/37/d2/37d211d0-5c2c-42c6-bb71-ca7492c5e088.png?n=642227_Hero-Gallery-0_C1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/74/13/74131ebf-a57a-40c5-896a-70e4434186b1.png?n=642227_Hero-Gallery-0_C3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/d1/2c/d12cd3b8-3880-4dd4-8fe5-dc072a7904f0.png?n=642227_Hero-Gallery-0_C4_857x676.png",
                        },
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Disc Drive", "All Digital"],
                        },
                        {
                            title: "Storage",
                            values: ["1TB", "2TB"],
                        },
                        {
                            title: "Color",
                            values: ["Carbon Black", "Robot White", "Galaxy Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "Xbox Series X – 1TB Carbon Black - Disc Drive",
                            sku: "XBOX-SERIES-X-1TB-CARBON-BLACK-DISC-DRIVE",
                            options: {
                                Edition: "Disc Drive",
                                Storage: "1TB",
                                Color: "Carbon Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 460,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 12749700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2050000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 10800000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 499.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Xbox Series X – 1TB Robot White - All Digital",
                            sku: "XBOX-SERIES-X-1TB-ROBOT-WHITE-ALL-DIGITAL",
                            options: {
                                Edition: "All Digital",
                                Storage: "1TB",
                                Color: "Robot White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 414,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 11474700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 1845000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 9720000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 449.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Xbox Series X – 2TB Galaxy Black - Disc Drive",
                            sku: "XBOX-SERIES-X-2TB-GALAXY-BLACK-DISC-DRIVE",
                            options: {
                                Edition: "Disc Drive",
                                Storage: "2TB",
                                Color: "Galaxy Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 552,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 15299700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2460000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 12960000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 599.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    mid_code: "MS-XBSX-2020-001",
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Processor Cpu Cores": "8X Cores",
                        "Processor Cpu Clock Speed": "3.8 GHz",
                        "Processor Cpu Clock Speed Smt": "3.6 GHz w/SMT",
                        "Processor Cpu Architecture": "Custom Zen 2 CPU",
                        "Processor Gpu Performance": "12 TFLOPS",
                        "Processor Gpu Compute Units": "52 CUs",
                        "Processor Gpu Clock Speed": "1.825 GHz",
                        "Processor Gpu Architecture": "Custom RDNA 2 GPU",
                        "Processor Soc Die Size": "360.45 mm2",
                        "Processor Process": "7nm Enhanced",
                        "Memory Size": "16GB",
                        "Memory Type": "GDDR6",
                        "Memory Bus Width": "320 bit-wide",
                        "Memory Bandwidth 10GB": "560 GB/s",
                        "Memory Bandwidth 6GB": "336 GB/s",
                        "Internal Storage 1": "Xbox Series X Carbon Black: 1TB Custom NVME SSD",
                        "Internal Storage 2": "Xbox Series X – 1TB Digital Edition: 1TB Custom NVME SSD",
                        "Internal Storage 3": "Xbox Series X – 2TB Galaxy Black Special Edition: 2TB Custom NVME SSD",
                        "Io Throughput Raw": "2.4 GB/s",
                        "Io Throughput Compressed": "4.8 GB/s (with custom hardware decompression block)",
                        "Expandable Storage Supported": "Storage Expansion Cards for Xbox Series X|S, USB 3.1 external HDD (sold separately)",
                        "Gaming Resolution": "True 4K",
                        "High Dynamic Range": "Up to 8K HDR",
                        "Optical Drive 1": "Xbox Series X Carbon Black: 4K UHD Blu-Ray",
                        "Optical Drive 2": "Xbox Series X – 2TB Galaxy Black Special Edition: 4K UHD Blu-Ray",
                        "Performance Target": "Up to 120 FPS",
                        "Hdmi Features": "Auto Low Latency Mode, HDMI Variable Refresh Rate, AMD FreeSync",
                        "Sound Capabilities": "Dolby Digital 5.1, DTS 5.1, Dolby TrueHD with Atmos, Up to 7.1 L-PCM",
                        "Hdmi Ports": "1x HDMI 2.1 port",
                        "Usb Ports": "3x USB 3.1 Gen 1 ports",
                        "Wireless": "802.11ac dual band",
                        "Ethernet": "802.3 10/100/1000",
                        "Accessories Radio": "Dedicated dual band Xbox Wireless radio",
                        "Design Dimensions": "Height: 301 mm, Depth: 151 mm, Breadth: 151 mm",
                        "Design Weight": "9.8 lbs"
                    }
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Xbox Series S",
                    subtitle: "Microsoft",
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Consoles")?.id!,
                    ],
                    description:
                        "The Xbox Series S is Microsoft's compact, all-digital next-gen console. It offers up to 1440p resolution, 120 FPS gameplay, and lightning-fast load times powered by the Xbox Velocity Architecture. With a sleek design and no disc drive, it's the perfect choice for digital gaming enthusiasts.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://cms-assets.xboxservices.com/assets/bf/b0/bfb06f23-4c87-4c58-b4d9-ed25d3a739b9.png?n=389964_Hero-Gallery-0_A1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/07/a9/07a93846-20c6-4ccd-9b0a-88718a99f894.png?n=389964_Hero-Gallery-0_A2_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/c9/a2/c9a2613a-9ccb-4644-ba2f-87afeaf488b4.png?n=389964_Hero-Gallery-0_A3_857x676.png"
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/98/7b/987b8ad4-0f9e-4f65-bef7-f93ee9d1a689.png?n=389964_Hero-Gallery-0_A4_857x676.png"
                        }
                    ],
                    options: [
                        {
                            title: "Storage",
                            values: ["512GB", "1TB"],
                        },
                        {
                            title: "Color",
                            values: ["Robot White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Xbox Series S – 512GB Robot White",
                            sku: "XBOX-SERIES-S-512GB-WHITE",
                            options: {
                                Storage: "512GB",
                                Color: "Robot White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 299,
                                    currency_code: "usd",
                                },
                                {
                                    amount: 6800000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 269,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 1950000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 13500000,
                                    currency_code: "lak",
                                },
                            ],
                        },
                        {
                            title: "Xbox Series S – 1TB Robot White",
                            sku: "XBOX-SERIES-S-1TB-BLACK",
                            options: {
                                Storage: "1TB",
                                Color: "Robot White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 349,
                                    currency_code: "usd",
                                },
                                {
                                    amount: 7500000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 320,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 2200000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 15000000,
                                    currency_code: "lak",
                                },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    mid_code: "XBOX-SERIES-S-2025",
                    metadata: {
                        "Processor CPU": "Custom AMD 8-core Zen 2 @ 3.6 GHz",
                        "GPU": "AMD RDNA 2, 4 TFLOPS, 20 CUs @ 1.565 GHz",
                        "Memory": "10GB GDDR6",
                        "Internal Storage": "512GB or 1TB NVMe SSD",
                        "Expandable Storage": "Supports Seagate Storage Expansion Card (up to 2TB)",
                        "Resolution": "Up to 1440p",
                        "Frame Rate": "Up to 120 FPS",
                        "HDR": "Yes",
                        "Audio": "Dolby Digital 5.1, DTS 5.1, Dolby TrueHD with Atmos",
                        "Ports": "1x HDMI 2.1, 3x USB 3.1 Gen 1, Ethernet",
                        "Wireless": "802.11ac dual band",
                        "Dimensions": "6.5 cm x 15.1 cm x 27.5 cm",
                        "Weight": "1.93 kg",
                        "Release Date": "November 10, 2020",
                        "Backward Compatibility": "Supports Xbox One, Xbox 360, and original Xbox games",
                    },
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "GameSir G7 HE Wired Xbox Controller",
                    subtitle: "GameSir",
                    collection_id: collection.id,
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "The GameSir G7 HE is an officially licensed wired controller for Xbox Series X|S, Xbox One, and Windows 10/11. It features Hall Effect sticks and triggers for enhanced durability and precision, microswitch face buttons rated for 3 million clicks, and a magnetic swappable faceplate for customization. Designed for competitive gamers seeking reliability and performance.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://gamesir.com/cdn/shop/files/HE_8ccf6639-5af8-4173-9991-bb303c569222.png?v=1741000995&width=990",
                        },
                        {
                            url: "https://gamesir.com/cdn/shop/files/4_dcbf0729-9606-49fc-8e24-b14051816cce.png?v=1741000995&width=990",
                        },
                        {
                            url: "https://gamesir.com/cdn/shop/files/HE_8b751690-cccc-4f92-bdfa-41271057b229.png?v=1741000995&width=990",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["White", "Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "GameSir G7 HE Wired Xbox Controller (White)",
                            sku: "GAMESIR-G7HE-WHITE",
                            manage_inventory: true,
                            options: {
                                Color: "White",
                            },
                            prices: [
                                { amount: 49.99, currency_code: "usd" },
                                { amount: 1150000, currency_code: "vnd" },
                                { amount: 45.99, currency_code: "eur" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 1250000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "GameSir G7 HE Wired Xbox Controller (Black)",
                            sku: "GAMESIR-G7HE-BLACK",
                            manage_inventory: true,
                            options: {
                                Color: "Black",
                            },
                            prices: [
                                { amount: 49.99, currency_code: "usd" },
                                { amount: 1150000, currency_code: "vnd" },
                                { amount: 45.99, currency_code: "eur" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 1250000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Connectivity": "Wired USB-C",
                        "Compatibility": "Xbox Series X|S, Xbox One, Windows 10/11, Steam",
                        "Hall Effect Technology": "Yes (Sticks and Triggers)",
                        "Microswitch Face Buttons": "Rated for 3 million clicks",
                        "Swappable Faceplate": "Magnetic, paintable",
                        "Audio": "3.5mm Headphone Jack",
                        "Rumble Motors": "Dual vibration motors",
                        "Dimensions": "155 x 103 x 64 mm",
                        "Weight": "Approximately 256g",
                        "Official License": "Yes (Xbox Official Licensed Product)",
                    },
                },
            ],
        },
    });


    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Xbox Elite Wireless Controller Series 2 – Core",
                    subtitle: "Microsoft",
                    collection_id: collection.id,
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "Experience pro-level precision with the Xbox Elite Wireless Controller Series 2 – Core. Featuring adjustable-tension thumbsticks, wrap-around rubberized grip, and shorter hair trigger locks, this controller is designed for competitive gamers seeking enhanced performance and customization.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://assets.xboxservices.com/assets/85/64/85649e53-ef2a-45fe-9853-e83f8da160cc.png?n=Accessories_Panes-Triptic-Small-0_White-elite-series-2_204x204.png", // white
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["White", "Red", "Blue"],
                        },
                    ],
                    variants: [
                        {
                            title: "Xbox Elite Wireless Controller Series 2 – Core (White)",
                            sku: "XBOX-ELITE2-WHITE",
                            manage_inventory: true,
                            options: {
                                Color: "White",
                            },
                            prices: [
                                { amount: 129.99, currency_code: "usd" },
                                { amount: 2990000, currency_code: "vnd" },
                                { amount: 119.99, currency_code: "eur" },
                                { amount: 160000, currency_code: "khr" },
                                { amount: 1350000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Xbox Elite Wireless Controller Series 2 – Core (Red)",
                            sku: "XBOX-ELITE2-RED",
                            manage_inventory: true,
                            options: {
                                Color: "Red",
                            },
                            prices: [
                                { amount: 139.99, currency_code: "usd" },
                                { amount: 3200000, currency_code: "vnd" },
                                { amount: 129.99, currency_code: "eur" },
                                { amount: 170000, currency_code: "khr" },
                                { amount: 1450000, currency_code: "lak" },
                            ],
                        },
                        {
                            title: "Xbox Elite Wireless Controller Series 2 – Core (Blue)",
                            sku: "XBOX-ELITE2-BLUE",
                            manage_inventory: true,
                            options: {
                                Color: "Blue",
                            },
                            prices: [
                                { amount: 139.99, currency_code: "usd" },
                                { amount: 3200000, currency_code: "vnd" },
                                { amount: 129.99, currency_code: "eur" },
                                { amount: 170000, currency_code: "khr" },
                                { amount: 1450000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Connectivity": "Xbox Wireless, Bluetooth, USB-C",
                        "Compatibility": "Xbox Series X|S, Xbox One, Windows PC, Android, iOS",
                        "Battery Life": "Up to 40 hours",
                        "Custom Profiles": "Save up to 3 profiles",
                        "Adjustable Features": "Thumbstick tension, hair trigger locks",
                        "Grip": "Wrap-around rubberized grip",
                        "Weight": "345g",
                        "Release Date": "Varies by color (White: 2022, Red/Blue: 2023)",
                    },
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "ROG Raikiri PC Controller",
                    subtitle: "ASUS",
                    collection_id: collection.id,
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "The ROG Raikiri PC controller features two rear buttons, left and right triggers with short and full range of motion plus dead zone customization, built-in ESS DAC for supreme audio, joystick sensitivity and response curve customization. The ROG Raikiri is ideal for gaming on PC, laptop or the next gen Xbox console.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://dlcdnwebimgs.asus.com/gain/0F34A77C-0F26-4E0A-9B67-6143E5ADA4BB/w717/h525",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "ROG Raikiri PC Controller (Black)",
                            sku: "ROG-RAIKIRI-BLACK",
                            manage_inventory: true,
                            options: {
                                Color: "Black",
                            },
                            prices: [
                                { amount: 99.99, currency_code: "usd" },
                                { amount: 2300000, currency_code: "vnd" },
                                { amount: 89.99, currency_code: "eur" },
                                { amount: 115000, currency_code: "khr" },
                                { amount: 1250000, currency_code: "lak" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        "Connectivity": "Wired USB-C",
                        "Compatibility": "PC, Laptop, Xbox Series X|S",
                        "Rear Buttons": "2 programmable rear buttons",
                        "Triggers": "Left and right triggers with short and full range of motion",
                        "Customization": "Dead zone, joystick sensitivity, and response curve customization via Armoury Crate",
                        "Audio": "Built-in ESS DAC for supreme audio",
                        "Dimensions": "103 (W) x 64 (H) x 155 (L) mm",
                        "Weight": "330g",
                    },
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "PowerA FUSION Pro 4 Wired Controller for Xbox Series X|S",
                    subtitle: "PowerA",
                    collection_id: collection.id,
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "The PowerA FUSION Pro 4 Wired Controller for Xbox Series X|S offers pro-level features at a competitive price. Equipped with Hall Effect thumbsticks and triggers for enhanced precision and longevity, it also features Quick-Twist adjustable-height thumbsticks, four mappable Advanced Gaming Buttons, and 3-Way Trigger Locks. Dual Rumble Motors and Impulse Triggers provide immersive feedback, while the PowerA Gamer HQ App allows for extensive customization. Designed for comfort with textured rubberized grips and anti-friction rings, this controller ensures fatigue-free gaming sessions.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.12345.67890.abcdefg.hijklmn.opqrstuv",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "PowerA FUSION Pro 4 Wired Controller – Black",
                            sku: "PWR-FUSIONPRO4-BLK",
                            manage_inventory: true,
                            options: {
                                Color: "Black",
                            },
                            prices: [
                                { amount: 69.99, currency_code: "usd" },
                                { amount: 1690000, currency_code: "vnd" },
                                { amount: 64.99, currency_code: "eur" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    metadata: {
                        Manufacturer: "PowerA",
                        "Release Date": "September 19, 2024",
                        Compatibility: "Xbox Series X|S, Xbox One, Windows 10/11",
                        Features:
                            "Hall Effect thumbsticks and triggers, Quick-Twist adjustable-height thumbsticks, 4 mappable Advanced Gaming Buttons, 3-Way Trigger Locks, Dual Rumble Motors, Impulse Triggers, PowerA Gamer HQ App support",
                        Connectivity: "Wired (10 ft. braided USB-C cable)",
                        Audio: "3.5mm stereo headset jack with one-touch mic mute and LED indicator",
                        Ergonomics: "Textured rubberized grips, anti-friction rings",
                    },
                },
            ],
        },
    });


    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Nintendo Switch",
                    subtitle: "Nintendo",
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "Nintendo Switch is a versatile gaming console that offers a unique hybrid experience. Enjoy gaming on your TV or on-the-go with detachable controllers and a vast library of exclusive titles.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        { url: "https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1065/b_white/f_auto/q_auto/ncom/My%20Nintendo%20Store/EN-US/Hardware/nintendo-switch-neon-blue-neon-red-joy-con-117972/117972-nintendo-switch-neon-blue-neon-red-package-front-1200x675" },
                        { url: "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/c_scale,w_700/ncom/en_US/products/hardware/nintendo-switch-red-blue/110478-nintendo-switch-neon-blue-neon-red-console-docked-joy-con-grip-1200x675" },
                        { url: "https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1065/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-gray/110477-nintendo-switch-gray-gray-package-front-1200x675" },
                        { url: "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/c_scale,w_100/ncom/en_US/products/hardware/nintendo-switch-gray/110477-nintendo-switch-gray-gray-console-docked-joy-con-grip-1200x675" },
                    ],
                    options: [
                        {
                            title: "Model",
                            values: ["Standard", "OLED"],
                        },
                        {
                            title: "Color",
                            values: ["Neon Red/Neon Blue", "Gray"],
                        },
                    ],
                    variants: [
                        {
                            title: "Nintendo Switch – Standard Neon Red/Neon Blue",
                            sku: "NINTENDO-SWITCH-STANDARD-NEON",
                            options: {
                                Model: "Standard",
                                Color: "Neon Red/Neon Blue",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 269,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 6800000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 1950000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 13500000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 299.99,
                                    currency_code: "usd",
                                },
                            ],
                        },
                        {
                            title: "Nintendo Switch – OLED Gray",
                            sku: "NINTENDO-SWITCH-OLED-GRAY",
                            options: {
                                Model: "OLED",
                                Color: "Gray",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 320,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 7500000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2200000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 15000000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 349.99,
                                    currency_code: "usd",
                                },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    mid_code: "NT-SWITCH-3983-301",
                    metadata: {
                        "Processor Cpu Cores": "4 cores",
                        "Processor Cpu Clock Speed": "1.02 GHz",
                        "Processor Cpu Architecture": "ARM Cortex-A57",
                        "Processor Gpu Performance": "Approx. 1.0 TFLOPS",
                        "Processor Gpu Compute Units": "256 CUDA cores",
                        "Processor Gpu Clock Speed": "768 MHz",
                        "Processor Gpu Architecture": "Nvidia Maxwell",
                        "Processor Process": "20nm",
                        "Memory Size": "4GB",
                        "Memory Type": "LPDDR4",
                        "Memory Bandwidth": "25.6 GB/s",
                        "Internal Storage": "32GB eMMC",
                        "Expandable Storage Supported": "microSDXC (up to 2TB)",
                        "Gaming Resolution": "720p (handheld) / 1080p (docked)",
                        "High Dynamic Range": "Not supported",
                        "Performance Target": "Up to 60 FPS",
                        "Hdmi Features": "Standard HDMI output",
                        "Sound Capabilities": "Stereo speakers, 3.5mm headphone jack",
                        "Hdmi Ports": "1x HDMI (via dock)",
                        "Usb Ports": "1x USB-C (docking)",
                        "Wireless": "802.11ac Wi-Fi",
                        "Ethernet": "Supported via dock adapter",
                        "Design Dimensions": "102mm x 239mm x 13.9mm (handheld)",
                        "Design Weight": "297g"
                    }
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "PlayStation 5 Slim",
                    subtitle: "Sony",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Consoles")?.id!,
                    ],
                    description:
                        "The PlayStation 5 Slim is a more compact version of the powerful PS5, offering lightning-fast load times, stunning visuals up to 4K at 120Hz, and Tempest 3D AudioTech. Featuring a modular design with a detachable disc drive, the PS5 Slim maintains all the performance of its predecessor in a smaller form factor.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        { url: "https://media.direct.playstation.com/is/image/sierialto/PS5-Disc-Slim-New-Hero-1?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/PS5-Hero-1?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/ps5-slim-model-hero-new?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/PS5-Hero-3?$Background_Small$" }
                    ],
                    options: [
                        {
                            title: "Storage",
                            values: ["1TB SSD"],
                        },
                        {
                            title: "Edition",
                            values: ["Disc Edition", "Digital Edition"],
                        },
                    ],
                    variants: [
                        {
                            title: "PS5 Slim – Disc Edition",
                            sku: "PS5-SLIM-DISC",
                            options: {
                                Storage: "1TB SSD",
                                Edition: "Disc Edition",
                            },
                            manage_inventory: true,
                            prices: [
                                { amount: 480, currency_code: "eur" },
                                { amount: 13300000, currency_code: "vnd" },
                                { amount: 4000000, currency_code: "khr" },
                                { amount: 16000000, currency_code: "lak" },
                                { amount: 499.99, currency_code: "usd" },
                            ],
                        },
                        {
                            title: "PS5 Slim – Digital Edition",
                            sku: "PS5-SLIM-DIGITAL",
                            options: {
                                Storage: "1TB SSD",
                                Edition: "Digital Edition",
                            },
                            manage_inventory: true,
                            prices: [
                                { amount: 450, currency_code: "eur" },
                                { amount: 12500000, currency_code: "vnd" },
                                { amount: 3750000, currency_code: "khr" },
                                { amount: 15000000, currency_code: "lak" },
                                { amount: 449.99, currency_code: "usd" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    mid_code: "PS5-SLIM-2023-STD",
                    metadata: {
                        "Processor CPU Cores": "8-core AMD Zen 2 @ 3.5GHz",
                        "Processor GPU": "AMD RDNA 2, 10.28 TFLOPs, 36 CUs @ 2.23GHz",
                        "Memory Size": "16GB GDDR6",
                        "Memory Bandwidth": "448 GB/s",
                        "Internal Storage": "1TB SSD (approx. 825GB usable)",
                        "Expandable Storage Supported": "NVMe SSD (M.2 Slot)",
                        "Gaming Resolution": "Up to 4K @ 120Hz, 8K supported",
                        "Audio": "Tempest 3D AudioTech",
                        "HDR Support": "Yes",
                        "Ports": "2x USB-C, 2x USB-A, HDMI 2.1",
                        "Wireless": "Wi-Fi 6 (802.11ax), Bluetooth 5.1",
                        "Ethernet": "Yes",
                        "Disc Drive": "Ultra HD Blu-ray (Detachable)",
                        "Design Dimensions": "358 × 96 × 216 mm",
                        "Design Weight": "3.2 kg",
                    }
                },
            ],
        },
    });
    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "DualSense Edge Wireless Controller",
                    subtitle: "Sony",
                    category_ids: [
                        accessoriesResult.find((cat) => cat.name === "Controllers")?.id!,
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "The DualSense Edge Wireless Controller is Sony's first ultra-customizable controller for the PlayStation 5, designed for competitive gamers seeking personalized control and enhanced performance. Featuring adjustable trigger lengths, remappable buttons, and replaceable stick modules, it offers a tailored gaming experience.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        { url: "https://media.direct.playstation.com/is/image/sierialto/dualsense-edge-ps5-controller-front?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/dualsense-edge-ps5-controller-back?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/dualsense-edge-ps5-controller-front-right?$Background_Small$" },
                        { url: "https://media.direct.playstation.com/is/image/sierialto/dualsense-edge-ps5-controller-top-left?$Background_Small$" },

                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["White", "Midnight Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "DualSense Edge – White",
                            sku: "DUALSENSE-EDGE-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                { amount: 199.99, currency_code: "usd" },
                                { amount: 4800000, currency_code: "vnd" },
                                { amount: 185, currency_code: "eur" },
                            ],
                        },
                        {
                            title: "DualSense Edge – Midnight Black",
                            sku: "DUALSENSE-EDGE-BLACK",
                            options: {
                                Color: "Midnight Black",
                            },
                            manage_inventory: true,
                            prices: [
                                { amount: 199.99, currency_code: "usd" },
                                { amount: 4900000, currency_code: "vnd" },
                                { amount: 185, currency_code: "eur" },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                    mid_code: "DS-EDGE-2023-CTRL",
                    metadata: {
                        "Adjustable Trigger Lengths": "Yes",
                        "Remappable Buttons": "Yes",
                        "Replaceable Stick Modules": "Yes",
                        "Custom Profiles": "Up to 3",
                        "Haptic Feedback": "Yes",
                        "Adaptive Triggers": "Yes",
                        "Built-in Microphone": "Yes",
                        "Motion Controls": "Yes",
                        "Connectivity": "Wireless / USB-C",
                        "Weight": "Approximately 325g",
                        "Included Accessories": "Carrying Case, Braided USB Cable, Stick Caps, Back Buttons",
                    }
                },
            ],
        },
    });



    logger.info("Finished seeding product data.");

    logger.info("Seeding inventory item data...");
    const inventoryItemIds = (await inventoryModuleService.listInventoryItems({
    })).map(item => item.id);
    await batchInventoryItemLevelsWorkflow(container)
        .run({
            input: {
                create: inventoryItemIds.map(id => {
                    return {
                        inventory_item_id: id,
                        location_id: stockLocation.id,
                        stocked_quantity: 100,
                    }
                })
            }
        });
    logger.info("Finished seeding inventory item data.");
    logger.info("Finished seeding store data...");
}
