import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

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
    @IsString({each: true})
    @IsOptional()
    tags?: string[];
}