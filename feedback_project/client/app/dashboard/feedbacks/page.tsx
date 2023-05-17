'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Accordion, Button, Divider, ScrollArea } from '@mantine/core';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';

type FeedbackPage = {
  id: number;
  url_token: string;
  created_at: Date;
  expire_time: any;
};

interface Feedback {
  id: number;
  content: string;
  created_at: string;
  feedback_type_id: number;
  feedback_type_name: string;
}

function formatRemainingTime(date: any) {
  let expireTime: any = new Date(date);
  let now: any = new Date();
  let diffInMs = expireTime - now;
  const diffInSec = Math.round(diffInMs / 1000);
  const days = Math.floor(diffInSec / 86400);
  const hours = Math.floor((diffInSec % 86400) / 3600);
  const minutes = Math.floor((diffInSec % 3600) / 60);

  return `${days} gün, ${hours} saat ve ${minutes} dakika`;
}

export default function Feedbacks({ props }: any) {
  const [qrData, setQRData] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackPages, setFeedbackPages] = useState([]);
  const [newlyLoadedFeedbacks, setNewlyLoadedFeedbacks] = useState([]);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [currentFeedbackCount, setCurrentFeedbackCount] = useState(0);

  const handleGetFeedbackPage = async () => {
    const res = await fetch('http://localhost:5000/api/v1/feedback_pages', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    setFeedbackPages(data.Feedbacks);
  };

  useEffect(() => {
    handleGetFeedbackPage();
  }, []);

  const handleCreateFeedbackPage = async () => {
    const res = await fetch('http://localhost:5000/api/v1/feedback_pages', {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      notifications.show({
        title: 'İşlem Başarılı',
        message: 'Yeni Geri Bildirim Sayfanız Oluşturuldu',
        color: 'green',
        autoClose: 1500,
      });
      handleGetFeedbackPage();
    }
    if (res.status === 400) {
      notifications.show({
        title: 'İşlem Başarısız',
        message: 'Token Oluşturma Hakkınız Bitmiştir',
        color: 'red',
        autoClose: 1500,
      });
    }
  };

  const generateQRCode = async (url: any) => {
    console.log(url);
    const data = `http://localhost:3000/send-feedbacks/${url}}`;
    const qrCode = await QRCode.toDataURL(data);
    setQRData(qrCode);
  };

  const downloadQRCode = async (urlToken: any) => {
    const qrCode = await QRCode.toDataURL(urlToken);
    const blob = await fetch(qrCode).then((res) => res.blob());
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteFeedbackPage = async (id: any) => {
    const res = await fetch(
      `http://localhost:5000/api/v1/feedback_pages/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    );
    if (res.ok) {
      notifications.show({
        title: 'Silindi',
        message: 'İşlem Başarılı',
        color: 'green',
        autoClose: 1500,
      });
      handleGetFeedbackPage();
    }
  };
  const getFeedbacks = async () => {
    const res = await fetch('http://localhost:5000/api/v1/feedbacks', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    const { Feedbacks, total } = data;
    setTotalFeedbacks(total);
    setCurrentFeedbackCount(Feedbacks.length);
    console.log(data);

    setFeedbacks(data.Feedbacks);
  };
  useEffect(() => {
    getFeedbacks();
  }, []);

  const handleDeleteFeedback = async (id: number) => {
    const res = await fetch(`http://localhost:5000/api/v1/feedbacks/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      notifications.show({
        title: 'Silindi',
        message: 'İşlem Başarılı',
        color: 'green',
        autoClose: 1500,
      });
      getFeedbacks();
    }
  };

  const handleGetMoreFeedbacks = async () => {
    const res = await fetch(
      `http://localhost:5000/api/v1/feedbacks?offset=${currentFeedbackCount}`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );
    const data = await res.json();
    const newFeedbacks = data.Feedbacks;
    setNewlyLoadedFeedbacks(newFeedbacks);
    setFeedbacks((prevFeedbacks) => [...prevFeedbacks, ...newFeedbacks]);
    setCurrentFeedbackCount((prevCount) => prevCount + newFeedbacks.length);
    setTotalFeedbacks(data.totalFeedbacks);
  };

  useEffect(() => {
    // İlk yükleme için feedbackleri getir
    handleGetMoreFeedbacks();
    window.addEventListener('scroll', handleScroll); // Scroll olayını dinle
    return () => {
      window.removeEventListener('scroll', handleScroll); // Scroll olayını temizle
    };
  }, []);

  useEffect(() => {
    console.log(feedbacks);
  }, [feedbacks]);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      handleGetMoreFeedbacks();
    }
  };

  return (
    <div>
      <div className="bg-gray-50">
        <div className="p-3">
          <div className="mb-10">
            <Button
              onClick={handleCreateFeedbackPage}
              mb="xl"
              ml="md"
              variant="outline"
            >
              Token Oluştur
            </Button>
            {feedbackPages.map((feedbackPage: FeedbackPage) => (
              <Accordion key={feedbackPage.id}>
                <Accordion.Item value="customization">
                  <Button
                    onClick={(e) => handleDeleteFeedbackPage(feedbackPage.id)}
                    className="ml-4 mt-1 w-10"
                    variant="outline"
                    color="red"
                    compact
                  >
                    Sil
                  </Button>
                  <Accordion.Control>
                    {' '}
                    {feedbackPage.id}. Token |{' '}
                    {formatRemainingTime(feedbackPage.expire_time)}{' '}
                  </Accordion.Control>
                  <Accordion.Panel>
                    <span className="text-blue-800">Url Adresi: </span>{' '}
                    <Link
                      className="hover:underline hover:text-blue-600"
                      href={`http://localhost:3000/send-feedbacks/${feedbackPage.url_token}`}
                    >
                      {' '}
                      {`http://localhost:3000/send-feedbacks/${feedbackPage.url_token}`}{' '}
                    </Link>
                    <Button
                      onClick={(e) => generateQRCode(feedbackPage.url_token)}
                      variant="outline"
                      color="green"
                      compact
                    >
                      Qr Kodunuzu Açın
                    </Button>
                    {qrData ? (
                      <>
                        <img src={qrData} alt="QR Code" />
                        <Button
                          onClick={() => downloadQRCode(feedbackPage.url_token)}
                          variant="outline"
                          color="violet"
                          compact
                        >
                          İndir
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400 mb-1">
                          Qr kodunuz, süresi bitene kadar devam edecektir
                        </p>
                      </>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            ))}
          </div>
          <h3 className="text-xl text-center mb-1 font-medium hover:text-gray-800">
            Geri bildirimleriniz burda görünür
          </h3>
          <Divider size="xs" mb="xl" />
          <button onClick={handleGetMoreFeedbacks}>Daha Fazla Yükle</button>
          <ScrollArea
            type="auto"
            h={500}
            scrollHideDelay={400}
            onScroll={handleScroll}
          >
            <div className="container mt-4 mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {feedbacks
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )
                  .map((feedback: any) => {
                    let createdDate = new Date(
                      feedback.created_at,
                    ).toLocaleDateString();
                    const colorClasses: any = {
                      1: 'bg-yellow-600',
                      2: 'bg-blue-600',
                      3: 'bg-red-600',
                      4: 'bg-green-600',
                    };

                    return (
                      <div
                        key={feedback.id}
                        className="card m-2 p-1 border border-gray-400 rounded-sm hover:shadow-md hover:border-opacity-50 transform hover:-translate-y-1 transition-all duration-200"
                      >
                        <Button
                          onClick={(e) => handleDeleteFeedback(feedback.id)}
                          className="ml-1 mt-1 w-10"
                          variant="outline"
                          color="red"
                          radius="xs"
                          size="xs"
                          compact
                        >
                          Sil
                        </Button>
                        <div className="m-3">
                          <h2 className="text-lg mb-2">
                            {' '}
                            Geri bildirim
                            <span
                              className={`text-sm text-gray-100 font-mono ${
                                colorClasses[feedback.feedback_type_id]
                              } inline rounded-sm px-3 mt-1 align-top float-right animate-pulse`}
                            >
                              {' '}
                              {feedback.feedback_type_name}{' '}
                            </span>
                          </h2>
                          <Divider mb="xs" />
                          <p className="font-light cursor-text font-mono text-sm text-gray-700 hover:text-gray-900 transition-all duration-200">
                            {' '}
                            {feedback.content}{' '}
                          </p>
                        </div>
                        <div>
                          <Divider />
                          <p className="ml-3 text-sm mt-1">{createdDate}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
