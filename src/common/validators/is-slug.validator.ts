import { registerDecorator, ValidationOptions } from "class-validator";

export function IsSlug(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSlug',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: `${propertyName} must be a valid URL-safe slug (lowercase letters, numbers and hyphens only)`,
                ...validationOptions
            },
            validator: {
                validate(value, _args) {
                    if (typeof value !== 'string') return false;
                    // matches kebab-case slugs
                    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
                },
            }
        })
    }
}