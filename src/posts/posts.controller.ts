import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('Posts Managemnet')
@Controller('posts')
export class PostsController {
    private readonly logger = new Logger(PostsController.name);

    constructor(
        private readonly postsService: PostsService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create an publish a new post'
    })
    async create(@Body() createPostDo : CreatePostDto) {
        return {
            id: 1,
            ...createPostDo,
            createdAt: new Date().toDateString()
        }
    }
}
