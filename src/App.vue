<script setup>
</script>

<template>
  <nav>
    <ul>
      <li>
        <RouterLink class="nav-link" to="/">
          Home
        </RouterLink>
      </li>
      <li>
        <RouterLink class="nav-link" to="/wish/vtec">
          Wish
        </RouterLink>
      </li>
      <li>
        <RouterLink class="nav-link" to="/teacher/vtec">
          Teacher
        </RouterLink>
      </li>
    </ul>
  </nav>
  <main>
    <RouterView/>
  </main>
</template>

<style scoped>
nav {
  margin-bottom: 1rem;
}

nav ul {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  padding: 1rem;
  list-style: none;
}

.nav-link {
  padding: var(--space-sm) var(--space-md);
  color: inherit;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  transition:
    color var(--transition),
    background-color var(--transition),
    border-color var(--transition);
}

.nav-link:hover {
  color: #fff;
  background-color: var(--color-yellow);
  border-color: var(--ink);
}
</style>
