FROM nginx:1.27

RUN apt-get update \
    && apt-get install openssl curl -y \
    && apt-get clean

RUN rm /etc/nginx/conf.d/default.conf

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./entrypoint.sh .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]

CMD [ "nginx", "-g", "daemon off;" ]