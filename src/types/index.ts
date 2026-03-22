export interface Moment {
  datalineobject_id: string;
  user_id: string;
  object_title: string;
  posted_by: string;
  start_date: string;
  moment_link: string;
  object_desc: string;
  user_profile_picture: string;
  location: string;
  mediadata: MediaItem[];
  media_count: number;
  like_counter: number;
  mylike_status: number;
  comments_counter: number;
  thread_id: string;
}

export interface MediaItem {
  media_id: string;
  media_desc: string;
  url: string;
  media_type: 'image' | 'video';
}

export interface Thread {
  thread_id: string;
  user_id: string;
  title: string;
  description: string;
  created_datetime: string;
  channel_type: string;
}

export interface Comment {
  comment_id: string;
  datalineobject_id: string;
  user_id: string;
  comment_text: string;
  created_datetime: string;
  posted_by: string;
}
