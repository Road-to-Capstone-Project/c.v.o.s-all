import { Module } from "@medusajs/framework/utils";
import ReviewModuleService from "./service";


export const REVIEW_MODULE = "Review";

export default Module(REVIEW_MODULE, { service: ReviewModuleService });
