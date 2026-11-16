
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ArrayMaxSize,
  Matches,
  MaxLength,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(8000)
  content: string;
}

export class ChatImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsString()
  @Matches(/^(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain)$/)
  mimeType: string;

  @IsString()
  @MaxLength(6_000_000)
  data: string;
}

export class ChatDto {
  @IsString()
  @MaxLength(8000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  mode?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ChatImageDto)
  images?: ChatImageDto[];
}
