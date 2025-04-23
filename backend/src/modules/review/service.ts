import { MedusaService } from "@medusajs/framework/utils";
import { Review } from "./models";


class ReviewModuleService extends MedusaService({ Review }) { }

export default ReviewModuleService;
