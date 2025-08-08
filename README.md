# Airtimeline

Airtimeline is a React component for visualizing items on a timeline. It arranges events in compact, horizontal lanes, making it easy to see overlaps and gaps.

## Features

- Change the view to month, week, or day
- Edit item names inline
- Adjust item dates with drag-and-drop

---

### What I like

I like the minimalism and cleanliness, as well as the interactions when dragging events. The instructions were straightforward and easy to follow, and I appreciate the mock data and assignLanes function, but I wish I had a bit more time to round things out. :)

### What I would change

If I had more time, I'd first definitely decouple the timeline component and all of the logic into separate hooks, for better reusability and testability.

Second, I'd make sure it's responsive and fully accessible to screen readers and keyboard users.

I'd also add more microinteractions using Framer:

- When clicking the navigation items
- When finishing edits
- Improve dragging effect

### How I made my design decisions

I found timeline inspirations on Dribble, and used Airtable's website as design reference for colors and styles.

### How I would test this if I had more time

There are some bugs to fix in the week and daily view which I found last second. Having more time, I would've unit tested and created stories for each section of the timeline, so everything is documented and tested.
