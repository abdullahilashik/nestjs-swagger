import { Type } from "class-transformer";
import { PostStatus } from "./create-post.dto";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export enum PostSortBy {
    CREATED_AT = 'createdAt',
    VIEW_COUNT = 'viewCount',
    TITLE = 'title'
}

export enum SortDirection {
    DESC = 'desc',
    ASC = 'asc'
}

export class FindPostsQueryDto {
    /**
     * Page number for pagination
     * @default 1
     * @example 1
     */

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    page: number = 1;

    /**
     * Number of records returned per page
     * @default 10
     * @example 10
     */
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit: number = 10;


    /**
     * Search by string
     * @example 'how to make it work'
     */
    @IsString()
    @IsOptional()
    search?: string;

    /**
     * Status for the post
     * @example DRAFT
     */
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    /**
     * Sort posts by given options
     * @example CREATED_AT
     */
    @IsEnum(PostSortBy)
    @IsOptional()
    sortBy?: PostSortBy = PostSortBy.CREATED_AT;

    /**
     * Sort items by ascending or descending
     * @example DESC
     */
    @IsEnum(SortDirection)
    @IsOptional()
    sortOrder?: SortDirection = SortDirection.DESC;
}