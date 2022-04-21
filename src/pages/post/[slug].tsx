import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
      copyright: string;
      dimensions: { width: number; height: number };
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface StaticPathsProps {
  paths: {
    params: { slug: string };
  }[];

  fallback: boolean;
}

export default function Post({ post }: PostProps) {
  let totalString = 0;

  post.data.content.forEach(body => {
    body.body.forEach(string => {
      totalString += string.text.split(' ').length;
    });
  });

  const readTime = Math.ceil(totalString / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Header />

      <main className={styles.pageContainer}>
        <div className={styles.postContainer}>
          <div className={styles.imageContainer}>
            <img src={post.data.banner.url} alt={post.data.banner.alt} />
          </div>
          <h1>{post.data.title}</h1>
          <div className={styles.postDetails}>
            <FiCalendar size={20} />
            <p>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </p>
            <FiUser size={20} />
            <p>{post.data.author}</p>
            <FiClock size={20} />
            <p>{readTime} min</p>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(content => {
              return (
                <div key={post.first_publication_date + content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticPaths = async (): Promise<StaticPathsProps> => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid, //ADiciona o UID
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle, //Adiciona o subtitle
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
