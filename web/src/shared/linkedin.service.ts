"use public";

import { SUPABASE_CLIENT } from "@/supabase/supabase.module";
import { Shared, Inject, Injectable, UseGuards } from "@kithinji/orca";
import { InjectRepository } from "@kithinji/typeorm";
import { SupabaseClient } from "@supabase/supabase-js";
import { Repository } from "typeorm";
import { LinkedinPost } from "./entities/post.entity";
import { SupabaseAuthGuard } from "@/auth/supabase.guard";
import { type Request } from "express";
import { User } from "@/auth/entities/user.entity";
import { AuthService } from "@/auth/auth.service";

interface LinkedInImageUploadResponse {
  value: {
    uploadMechanism: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
        uploadUrl: string;
        headers: Record<string, string>;
      };
    };
    asset: string;
    mediaArtifact: string;
  };
}

interface LinkedInPostResponse {
  id: string;
  activity: string;
}

@Injectable()
export class LinkedinService {
  request!: Request;

  constructor(
    @Shared()
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    @InjectRepository(LinkedinPost)
    private readonly linkedinPostRepo: Repository<LinkedinPost>,
    private readonly authService: AuthService,
  ) {}

  private user(): User | undefined {
    return (this.request as any).user;
  }

  private getAuthenticatedUser(): User {
    const user = this.user();
    if (!user) {
      throw new Error("User is not authenticated");
    }
    return user;
  }

  private async storeProviderTokenHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async storeProviderToken(token: string): Promise<boolean> {
    const user = this.getAuthenticatedUser();

    await this.authService.updateUser(user.id, {
      provider_token: token,
    });

    return true;
  }

  private async getPostsHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async getPosts(
    limitPosted: number,
    offsetPosted: number,
    limitQueued: number,
    offsetQueued: number,
  ): Promise<LinkedinPost[]> {
    const user = this.getAuthenticatedUser();

    let postedPosts: LinkedinPost[] = [];
    let queuedPosts: LinkedinPost[] = [];

    if (limitPosted > 0) {
      postedPosts = await this.linkedinPostRepo.find({
        where: { posted: true, user: { id: user.id } },
        order: { created_at: "DESC" },
        take: limitPosted,
        skip: offsetPosted,
      });
    }

    if (limitQueued > 0) {
      queuedPosts = await this.linkedinPostRepo.find({
        where: { posted: false, user: { id: user.id } },
        order: { created_at: "ASC" },
        take: limitQueued,
        skip: offsetQueued,
      });
    }

    return [...postedPosts, ...queuedPosts];
  }

  private async createPostHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async createPost(
    content: string,
    images: Express.Multer.File[],
  ): Promise<LinkedinPost> {
    const user = this.getAuthenticatedUser();
    const preview_text = this.createPreviewText(content, 50);

    const post = await this.linkedinPostRepo.save(
      this.linkedinPostRepo.create({
        preview_text,
        content,
        posted: false,
        images: [],
        user,
      }),
    );

    try {
      const uploadedImages = await this.uploadImagesToSupabase(images, post.id);

      post.preview_src = uploadedImages[0];
      post.images = uploadedImages;
      await this.linkedinPostRepo.save(post);

      return post;
    } catch (error) {
      await this.linkedinPostRepo.delete(post.id);
      throw new Error(
        `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async postHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async post(id: string): Promise<LinkedInPostResponse> {
    const linkedinPost = await this.linkedinPostRepo.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!linkedinPost) {
      throw new Error("LinkedIn post not found");
    }

    if (linkedinPost.posted) {
      throw new Error("Post has already been published");
    }

    const providerToken = linkedinPost.user.provider_token;
    if (!providerToken) {
      throw new Error(
        "LinkedIn access token not found. Please reconnect your LinkedIn account.",
      );
    }

    try {
      let linkedInMediaAssets: string[] = [];

      if (linkedinPost.images && linkedinPost.images.length > 0) {
        linkedInMediaAssets = await this.uploadImagesToLinkedIn(
          linkedinPost.images,
          providerToken,
          linkedinPost.user.owner_id,
        );
      }

      const response = await this.createLinkedInPost(
        linkedinPost.content,
        linkedInMediaAssets,
        providerToken,
        linkedinPost.user.owner_id,
      );

      linkedinPost.posted = true;
      linkedinPost.posted_at = new Date();
      linkedinPost.linkedin_post_id = response.id;
      await this.linkedinPostRepo.save(linkedinPost);

      return response;
    } catch (error) {
      throw new Error(
        `Failed to publish to LinkedIn: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async deletePostHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async deletePost(id: string): Promise<boolean> {
    const user = this.getAuthenticatedUser();

    const post = await this.linkedinPostRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.posted) {
      throw new Error("Cannot delete a post that has already been published");
    }

    if (post.images && post.images.length > 0) {
      await this.deleteImagesFromSupabase(post.id, post.images.length);
    }

    await this.linkedinPostRepo.delete(id);
    return true;
  }

  private async getLinkedInProfileHeaders() {
    const session = await this.supabaseClient.auth.getSession();
    const token = session?.data?.session?.access_token;

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  public async getLinkedInProfile(providerToken: string): Promise<{
    id: string;
    localizedFirstName: string;
    localizedLastName: string;
  }> {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch LinkedIn profile: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  private createPreviewText(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    const truncated = content.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > maxLength * 0.8) {
      return truncated.slice(0, lastSpace).trim() + "...";
    }

    return truncated.trim() + "...";
  }

  private async uploadImagesToSupabase(
    images: Express.Multer.File[],
    postId: string,
  ): Promise<string[]> {
    const uploadedImages: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const ext = image.originalname.split(".").pop() || "jpg";
      const fileName = `posts/${postId}_${i}.${ext}`;

      const { error } = await this.supabaseClient.storage
        .from("images")
        .upload(fileName, image.buffer, {
          contentType: image.mimetype,
          upsert: false,
        });

      if (error) {
        await this.cleanupPartialUpload(postId, i);
        throw new Error(`Image upload failed: ${error.message}`);
      }

      const { data } = this.supabaseClient.storage
        .from("images")
        .getPublicUrl(fileName);

      uploadedImages.push(data.publicUrl);
    }

    return uploadedImages;
  }

  private async cleanupPartialUpload(
    postId: string,
    uploadedCount: number,
  ): Promise<void> {
    const filesToDelete = Array.from({ length: uploadedCount }, (_, i) =>
      `posts/${postId}_${i}.*`.replace(".*", ""),
    );

    if (filesToDelete.length > 0) {
      await this.supabaseClient.storage.from("images").remove(filesToDelete);
    }
  }

  private async deleteImagesFromSupabase(
    postId: string,
    imageCount: number,
  ): Promise<void> {
    const filesToDelete = Array.from(
      { length: imageCount },
      (_, i) => `posts/${postId}_${i}`,
    );

    await this.supabaseClient.storage.from("images").remove(filesToDelete);
  }

  private async uploadImagesToLinkedIn(
    imageUrls: string[],
    providerToken: string,
    linkedinId: string,
  ): Promise<string[]> {
    const mediaAssets: string[] = [];
    const ownerUrn = `urn:li:person:${linkedinId}`;

    for (const imageUrl of imageUrls) {
      const registerResponse = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${providerToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              owner: ownerUrn,
              serviceRelationships: [
                {
                  relationshipType: "OWNER",
                  identifier: "urn:li:userGeneratedContent",
                },
              ],
            },
          }),
        },
      );

      if (!registerResponse.ok) {
        throw new Error(
          `Failed to register image upload: ${registerResponse.statusText}`,
        );
      }

      const registerData: LinkedInImageUploadResponse =
        await registerResponse.json();
      const uploadUrl =
        registerData.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      const asset = registerData.value.asset;

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from storage: ${imageUrl}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to upload image to LinkedIn: ${uploadResponse.statusText}`,
        );
      }

      mediaAssets.push(asset);
    }

    return mediaAssets;
  }

  private async createLinkedInPost(
    content: string,
    mediaAssets: string[],
    providerToken: string,
    owner_id: string,
  ): Promise<LinkedInPostResponse> {
    const ownerUrn = `urn:li:person:${owner_id}`;

    const postData: any = {
      author: ownerUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: mediaAssets.length > 0 ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    if (mediaAssets.length > 0) {
      postData.specificContent["com.linkedin.ugc.ShareContent"].media =
        mediaAssets.map((asset) => ({
          status: "READY",
          description: {
            text: "Image",
          },
          media: asset,
          title: {
            text: "Image",
          },
        }));
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LinkedIn API error: ${response.statusText} - ${errorText}`,
      );
    }

    return await response.json();
  }
}
