import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import doPromise from '@common/doPromise';
import fetch from 'node-fetch';

const client = new ApolloClient ({
  uri: __DEV__ ? '/graphql' : 'http://127.0.0.1:3000/graphql',
  fetch,
});

export const graphql = ({type = 'query', args}) => {
  return doPromise (
    new Promise (async (resolve, reject) => {
      let accessToken = __CLIENT__ ? localStorage.getItem ('accessToken') : '';
      let headers = {
        authorization: `bearer ${accessToken}`,
      };
      if (type == 'query') {
        await client
          .query ({
            query: gql`
        ${type}${args}
      `,
            context: {
              headers,
            },
          })
          .then (data => {
            console.log (data);
            resolve (data);
          })
          .catch (error => reject (error));
      } else {
        await client
          .mutate ({
            mutation: gql`
        ${type}${args}
      `,
            context: {
              headers,
            },
          })
          .then (data => {
            console.log (data);
            resolve (data);
          })
          .catch (error => reject (error));
      }
    })
  );
};

// graphql ({args: '{users{username password}}'});
