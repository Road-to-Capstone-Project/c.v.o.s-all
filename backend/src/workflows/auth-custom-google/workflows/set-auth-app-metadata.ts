import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep, SetAuthAppMetadataStepInput } from "@medusajs/medusa/core-flows"

export const setAuthAppMetadataWorkflow = createWorkflow(
    "set-auth-app-metadata",
    function (input: SetAuthAppMetadataStepInput) {
        return new WorkflowResponse(setAuthAppMetadataStep(input))
    }
)
