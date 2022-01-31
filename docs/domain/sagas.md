# Sagas

::: mermaid
graph TD;
    League.CREATE_LEAGUE-->Season.CREATE_SEASON;
    Season.CREATE_SEASON-->League.START_SEASON;
:::

