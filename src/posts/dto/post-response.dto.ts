import { PostStatus } from "./create-post.dto";
import { PostMetadataDto } from "./post-metadata.dto";

export class PostResponseDto {
    /**
     * Database primary key identifier
     * @example 42
     */
    id: number;

    /**
     * Human readable post title
     * @example 'Enterprise architecture with nestjs'
     */
    title: string;

    /**
     * Unique URL slug
     * @example 'enterprise-architecture-with-nestjs'
     */
    slug: string;

    /**
     * Post publication content
     * @example '## Architectural overview....'
     */
    content: string;

    /**
     * Publication lifecycle state
     * @example 'DRAFT'
     */
    status: PostStatus;

    /**
     * Search optimization metadata
     * @example PostMedataDto | null
     */
    metadata: PostMetadataDto | null;

    /**
     * Total public views count
     * @example 1250
     */
    viewCount: number;

    /**
     * ISO 8601 creation timestamp
     * @example '2026-10-12T16:24:00-000Z'
     */
    createdAt: Date;

    /**
     * ISO 8061 creation timestamp
     * @example '2026-10-12T16:24:00-000Z'
     */
    updatedAt: Date;
}