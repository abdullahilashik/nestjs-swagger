import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { IsSlug } from "../../common/validators/is-slug.validator";
import { PostMetadataDto } from "./post-metadata.dto";
import {
    Type
} from 'class-transformer';

export enum PostStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

export class CreatePostDto {
    /**
     * The primary title of the blog post
     * @example "How to scale nestjs in enterprise environments"
     */
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(50)
    title: string;

    /**
     * Unique URL-Friendly slug identifier
     * @example 'how-to-scale-nestjs-in-enterprise-environments'
     */
    @IsString()
    @IsSlug()
    @IsNotEmpty()
    slug: string;

    /**
     * Full markdown content of the article
     * @example "# Introduction\nHere is how we scale..."
     */
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * Publication lifecycle state
     * @example "DRAFT"
     */
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus = PostStatus.DRAFT;


    /**
     * List of search tags categorized for this post
     * @example ['nodejs', 'architecture', 'drizzle']
     */
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ValidateNested()
    @Type(() => PostMetadataDto)
    @IsOptional()
    metadata: PostMetadataDto;
}