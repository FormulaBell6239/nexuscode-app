import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsIn(['question', 'discussion', 'project'])
  type: 'question' | 'discussion' | 'project';

  @IsString()
  @MinLength(5)
  @MaxLength(140)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  body: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(300)
  projectUrl?: string;
}

export class CreateReplyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class ListPostsQuery {
  @IsOptional()
  @IsIn(['all', 'questions', 'discussions', 'projects', 'unanswered'])
  filter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['recent', 'popular'])
  sort?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class ReportDto {
  @IsIn(['post', 'reply'])
  targetType: 'post' | 'reply';

  @IsInt()
  targetId: number;

  @IsIn(['spam', 'harassment', 'unsafe', 'inappropriate', 'other'])
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class ResolveReportDto {
  @IsIn(['remove', 'restore', 'dismiss'])
  action: 'remove' | 'restore' | 'dismiss';
}

export class BanUserDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  days: number;
}
