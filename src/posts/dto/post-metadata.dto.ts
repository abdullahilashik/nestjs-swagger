import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class PostMetadataDto {

    /**
     * Search engine description snippet
     * @example "Comprehensive guide to enterprise nestjs architectures"
     */
    @IsString()
    @MaxLength(160)
    @IsOptional()
    setDescription?: string;

    /**
     * Canonical URL for SEO deduplication
     * @example "https://enterprise.internal/blog/nestjs-scale"
     */
    @IsUrl()
    @IsOptional()
    canonicalUrl?: string;
}