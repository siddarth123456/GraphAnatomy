'use client';

import { ApolloClient, InMemoryCache, ApolloProvider as Provider, HttpLink } from '@apollo/client';
import React from 'react';

const httpLink = new HttpLink({
  uri: typeof window === 'undefined' ? 'http://localhost:3000/api/graphql' : '/api/graphql',
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={client}>{children}</Provider>;
}
