import { Module } from "@medusajs/framework/utils";
import RelatedProductModuleService from "./service";


export const RELATED_PRODUCT_MODULE = "related-product";

export default Module(RELATED_PRODUCT_MODULE, { service: RelatedProductModuleService });
