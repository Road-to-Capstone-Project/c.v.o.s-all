import {
    Context,
    IModuleService,
} from "@medusajs/types";
import {
    ModuleCreateRelatedProduct,
    ModuleRelatedProduct,
} from "./module";

/**
 * The main service interface for the RelatedProduct Module.
 */
export interface IRelatedProductModuleService extends IModuleService {

    createRelatedProducts(
        data: ModuleCreateRelatedProduct,
        sharedContext?: Context
    ): Promise<ModuleRelatedProduct>;

    createRelatedProducts(
        data: ModuleCreateRelatedProduct[],
        sharedContext?: Context
    ): Promise<ModuleRelatedProduct[]>;

    deleteRelatedProducts(ids: string[], sharedContext?: Context): Promise<void>;
}
