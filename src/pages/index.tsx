import Link from 'next/link';
import Head from 'next/head';
import Header  from '../components/Header';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { IoCalendarClearOutline, IoPersonOutline } from 'react-icons/io5';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import React from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}


export default function Home({ postsPagination }: HomeProps) {

  const [posts, setPosts] = React.useState(postsPagination.results);
  const [nextPage, setNextPage] = React.useState(postsPagination.next_page);

  // async function handleGetMorePosts(): Promise<void> {
  //   const response = await (await fetch(nextPage)).json();
  //   setPosts([...posts, ...response.results]);
  //   setNextPage(response.next_page);
  // }

  async function handleGetMorePosts(): Promise<void> {
    if (nextPage) {
      const response = await (await fetch(nextPage)).json();

      const newPosts = response.results.map((post: Post) => ({
        uid: post.uid,

        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        },

        first_publication_date: post.first_publication_date
      }))

      setNextPage(response.next_page)
      setPosts((oldState) => [...oldState, ...newPosts])
    }
  }


  return (
    <>
      <Head>
        <title>Posts | Space Traveling</title>
      </Head>
      <Header />

      <main className={styles.container}>
        <section className={styles.content}>

          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <div className={styles.post}>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>

                  <div className={styles.info}>
                    <span>
                      <IoCalendarClearOutline />
                      <p>
                        {format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}
                      </p>
                    </span>
                    <span>
                      <IoPersonOutline />
                      <p>{post.data.author}</p>
                    </span>
                  </div>
                </div>
              </a>
            </Link>
          ))}

          {!!nextPage && (
            <div className={styles.morePosts}>
              <button type="button" onClick={handleGetMorePosts}>
                Carregar mais posts
              </button>
            </div>
          )}

        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({ preview = false, previewData }) => {

  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      // fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      // ref: previewData?.ref ?? null,
    }
  );

  // console.log(JSON.stringify(response, null, 2));

  // const posts = response.results.map(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: post.first_publication_date,
  //     data: {
  //       title: post.data.title,
  //       subtitle: post.data.subtitle,
  //       author: post.data.author,
  //     }
  //   };
  // });

  // console.log('posts', posts);

  const finalProps = {
    next_page: response.next_page,
    results: response.results,
  };

  return {
    props: {
      postsPagination: finalProps,
      preview,
    },
    revalidate: 1800, // 30 minutos
  };


};