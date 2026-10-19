# Permission matrix

| Module | Action | Super Admin | Admin | Staff |
|---|---|---:|---:|---:|
| auth | login | Yes | Yes | Yes |
| employees | create | Yes | No | No |
| employees | view | Yes | Conditional | Conditional |
| applications | create | Yes | Conditional | Yes |
| applications | submit | Yes | Conditional | Yes |
| applications | approve | Yes | Conditional | No |
| customer | update | Yes | Conditional | Restricted |
| documents | upload | Yes | Conditional | Conditional |
