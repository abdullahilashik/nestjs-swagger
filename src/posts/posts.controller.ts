import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';

@ApiTags('Posts Managemnet')
@Controller('posts')
export class PostsController {
    private readonly logger = new Logger(PostsController.name);

    constructor(
        private readonly postsService: PostsService
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create an publish a new post',
        operationId: 'createUser',
        description: 'Validates unique slug constrants, sanitize markdown content and persists metadata'
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Post successfully created and staged',
        type: PostResponseDto, // explicitly binds the output contract to swagger
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Slug collision encountered',
        links: {
            CreatePost: {
                operationId: 'createUser',
                parameters: {

                },
                description: 'The id returned in the response body'
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Hey this is wrong!'
    })
    async create(@Body() createPostDto: CreatePostDto) {
        return this.postsService.createPost(createPostDto);
    }

    @ApiOperation({
        summary: 'Find post by a unique slug',
        description: 'Takes a slug (string) for an individual post and finds the post',
        operationId: 'getPostBySlug'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Post found and returned',
        type: PostResponseDto
    })

    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Could not find the post for ya'
    })

    async findOne(@Param('slug') slug: string): Promise<PostResponseDto> {
        return this.postsService.findBySlug(slug);
    }
}
