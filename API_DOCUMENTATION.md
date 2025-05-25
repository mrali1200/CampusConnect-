# CampusConnect+ API Documentation

## Overview

This document provides details on the API endpoints used in the CampusConnect+ application. The application uses Supabase as its backend service, which provides a RESTful API for data management.

## Base URL

All API requests are made to the Supabase instance at:

```
https://[your-supabase-project-id].supabase.co
```

## Authentication

All API requests require authentication using a JWT token. The token is obtained when a user signs in and should be included in the `Authorization` header of all requests.

```
Authorization: Bearer [token]
```

## Endpoints

### Events

#### Get All Events

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .order('date', { ascending: true });
```

#### Get Event by ID

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*, categories(*)')
  .eq('id', eventId)
  .single();
```

#### Filter Events by Category

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('category', categoryName)
  .order('date', { ascending: true });
```

#### Search Events

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`)
  .order('date', { ascending: true });
```

### Event Registrations

#### Register for an Event

```javascript
const { data, error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: eventId,
    user_id: userId,
    created_at: new Date().toISOString(),
  });
```

#### Check if User is Registered

```javascript
const { data, error } = await supabase
  .from('event_registrations')
  .select('id')
  .eq('event_id', eventId)
  .eq('user_id', userId)
  .single();
```

#### Get Registration Count

```javascript
const { count, error } = await supabase
  .from('event_registrations')
  .select('id', { count: 'exact' })
  .eq('event_id', eventId);
```

#### Update Check-in Status

```javascript
const { error } = await supabase
  .from('event_registrations')
  .update({ 
    checked_in: true,
    check_in_time: new Date().toISOString()
  })
  .eq('id', registrationId);
```

### Social Interactions

#### Like an Event

```javascript
const { data, error } = await supabase
  .from('event_likes')
  .insert({
    event_id: eventId,
    user_id: userId,
    created_at: new Date().toISOString(),
  });
```

#### Unlike an Event

```javascript
const { error } = await supabase
  .from('event_likes')
  .delete()
  .eq('event_id', eventId)
  .eq('user_id', userId);
```

#### Add a Comment

```javascript
const { data, error } = await supabase
  .from('comments')
  .insert({
    event_id: eventId,
    content: commentText,
    user_id: userId,
    parent_id: parentCommentId, // null for top-level comments
    created_at: new Date().toISOString(),
  });
```

#### Get Comments for an Event

```javascript
const { data, error } = await supabase
  .from('comments')
  .select(`
    id,
    content,
    user_id,
    parent_id,
    created_at,
    users:user_id (name, avatar_url),
    likes:comment_likes (count)
  `)
  .eq('event_id', eventId)
  .order('created_at', { ascending: true });
```

#### Share an Event

```javascript
const { data, error } = await supabase
  .from('event_shares')
  .insert({
    event_id: eventId,
    sender_id: senderId,
    recipient_id: recipientId,
    message: message,
    created_at: new Date().toISOString(),
  });
```

### Activity Feed

#### Get User Activities

```javascript
const { data, error } = await supabase
  .from('activities')
  .select(`
    id,
    user_id,
    activity_type,
    content,
    event_id,
    created_at,
    users:user_id (name, avatar_url),
    events:event_id (name, image_url)
  `)
  .order('created_at', { ascending: false })
  .limit(20);
```

#### Create Activity Entry

```javascript
const { data, error } = await supabase
  .from('activities')
  .insert({
    user_id: userId,
    activity_type: activityType, // 'registration', 'like', 'comment', 'share'
    content: content,
    event_id: eventId,
    created_at: new Date().toISOString(),
  });
```

## Data Models

### Events

| Column      | Type      | Description                     |
|-------------|-----------|---------------------------------|
| id          | uuid      | Primary key                     |
| name        | text      | Event name                      |
| description | text      | Event description               |
| date        | timestamp | Event date                      |
| time        | text      | Event time                      |
| venue       | text      | Event location                  |
| category    | text      | Event category                  |
| image_url   | text      | URL to event image              |
| popularity  | integer   | Popularity score                |
| created_at  | timestamp | Creation timestamp              |
| updated_at  | timestamp | Last update timestamp           |

### Event Registrations

| Column        | Type      | Description                     |
|---------------|-----------|---------------------------------|
| id            | uuid      | Primary key                     |
| event_id      | uuid      | Reference to events.id          |
| user_id       | uuid      | Reference to auth.users.id      |
| created_at    | timestamp | Registration timestamp          |
| checked_in    | boolean   | Whether user has checked in     |
| check_in_time | timestamp | Check-in timestamp              |

### Comments

| Column     | Type      | Description                     |
|------------|-----------|---------------------------------|
| id         | uuid      | Primary key                     |
| event_id   | uuid      | Reference to events.id          |
| user_id    | uuid      | Reference to auth.users.id      |
| content    | text      | Comment content                 |
| parent_id  | uuid      | Reference to comments.id        |
| created_at | timestamp | Creation timestamp              |

### Activities

| Column        | Type      | Description                     |
|---------------|-----------|---------------------------------|
| id            | uuid      | Primary key                     |
| user_id       | uuid      | Reference to auth.users.id      |
| activity_type | text      | Type of activity                |
| content       | text      | Activity content                |
| event_id      | uuid      | Reference to events.id          |
| created_at    | timestamp | Creation timestamp              |

## Error Handling

All API requests return an `error` object if the request fails. The error object contains information about what went wrong.

```javascript
if (error) {
  console.error('Error:', error.message);
  // Handle the error appropriately
}
```

## Rate Limiting

The Supabase API has rate limiting in place to prevent abuse. If you exceed the rate limit, you will receive a 429 Too Many Requests response.

## Pagination

For endpoints that return large amounts of data, you can use pagination to limit the number of results returned:

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .range(0, 9) // Get the first 10 results (0-9)
  .order('date', { ascending: true });
```

To get the next page of results:

```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .range(10, 19) // Get the next 10 results (10-19)
  .order('date', { ascending: true });
```
