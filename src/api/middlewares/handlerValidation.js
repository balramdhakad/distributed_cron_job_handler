import { ValidationError } from "../../utils/errors.js";

//validator
export const validate = async (schema, data) => {
    const result = await schema.safeParseAsync(data);

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        throw new ValidationError("Validation failed", fieldErrors);
    }

    return result.data;
};