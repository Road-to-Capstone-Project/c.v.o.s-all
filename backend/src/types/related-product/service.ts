import {
    BaseFilterable,
    Context,
    FindConfig,
    IModuleService,
} from "@medusajs/types";
import {
    ModuleCreateRelatedProduct,
    ModuleRelatedProduct,
    ModuleUpdateRelatedProduct,
} from "./module";

export interface ModuleRelatedProductFilters extends BaseFilterable<ModuleRelatedProductFilters> {
    q?: string;
    id?: string | string[];
    copurchase_frequency?: number;
}

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

    updateRelatedProducts(
        data: ModuleUpdateRelatedProduct[],
        sharedContext?: Context
    ): Promise<ModuleRelatedProduct[]>;

    listRelatedProducts(
        filters?: ModuleRelatedProductFilters,
        config?: FindConfig<ModuleRelatedProduct>,
        sharedContext?: Context
    ): Promise<ModuleRelatedProduct[]>;

    deleteRelatedProducts(ids: string[], sharedContext?: Context): Promise<void>;
}
