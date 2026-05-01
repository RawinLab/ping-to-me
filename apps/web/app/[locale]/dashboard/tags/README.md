# Tags Management Page

Location: `/dashboard/tags`

## Features Implemented

### 1. Statistics Dashboard
- **Total Tags**: Shows the total number of tags in the organization
- **Used Tags**: Tags that have at least one link associated
- **Unused Tags**: Tags with no links
- Gradient card design matching the overall dashboard aesthetic

### 2. Create Tag
- Dialog-based tag creation
- Tag name input with validation
- Color picker with 10 preset colors (Blue, Indigo, Purple, Pink, Red, Orange, Amber, Emerald, Teal, Cyan)
- Custom color picker for advanced customization
- Hex color input field
- Real-time error handling

### 3. Edit Tag
- Inline edit functionality
- Pre-filled form with existing tag data
- Same color picker interface as create
- Update tag name and color

### 4. Delete Tag
- AlertDialog confirmation before deletion
- Warning message when tag has associated links
- Shows link count in warning
- Explains that links won't be deleted, only the tag association

### 5. Merge Tags
- Combine two tags into one
- Select source tag (will be deleted)
- Select target tag (will receive all links)
- Shows link count for each tag in dropdown
- Validation to prevent merging a tag with itself

### 6. Tags Grid Display
- Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)
- Each tag card shows:
  - Color indicator bar at the top
  - Tag icon with color-matched background
  - Tag name
  - Link count
  - "View Links" button (only if tag has links)
  - Edit button
  - Delete button
- Hover effects and smooth transitions
- Empty state with call-to-action when no tags exist

### 7. Loading States
- Skeleton loaders for initial page load
- Button loading states during API operations
- Disabled buttons during submission

### 8. Error Handling
- Form validation errors
- API error messages displayed inline
- User-friendly error messages

## API Integration

All features integrate with the NestJS backend API:

- `GET /tags?orgId={orgId}` - Fetch all tags
- `POST /tags` - Create new tag
- `PATCH /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag
- `GET /tags/statistics?orgId={orgId}` - Fetch statistics
- `POST /tags/:id/merge` - Merge tags

## UI Components Used (shadcn/ui)

- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogTrigger`
- `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`
- `Button`, `Input`, `Label`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Badge`, `Skeleton`

## Navigation

The Tags page is accessible from the dashboard sidebar under "Tags" with the Tags icon.

## Styling

- Follows the same design patterns as other dashboard pages
- Gradient backgrounds and cards
- Rounded corners (rounded-xl)
- Shadow effects with hover states
- Color-coordinated with blue/indigo gradients
- Responsive design for all screen sizes

## Future Enhancements (Optional)

- Bulk tag operations
- Tag import/export
- Tag usage analytics
- Tag suggestions based on link content
- Drag and drop to reorder tags
- Tag groups/categories
