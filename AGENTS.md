# Project rules
- Category visibility uses persisted category activation flags; administrators can read inactive categories through a dedicated SELECT policy so they can reactivate them.
- Validate public category URLs against active parent and child categories before querying products to prevent a disabled URL from falling back to an unfiltered list.