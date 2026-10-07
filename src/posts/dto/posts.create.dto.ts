export class PostsCreateDto {
    title: string;
    description: string;
    image: unknown; // use 'unknown' type of image upload, you can change it to 'string' or 'Buffer' based on your implementation
}