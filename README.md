# mpvue-iview-weapp

>ʹ��mpvueͨ��usingComponents����[iview-weapp](https://github.com/TalkingData/iview-weapp)

## Ԥ��

``` bash
1. git clone
git clone https://github.com/splendid789/yinya_front.git

2. ��װ����
cd yinya_front && cnpm i

3. ��������
npm run dev

4. Ԥ��
��΢�ſ����߹��ߣ��½���Ŀ����Ŀ¼ָ�� /dist/wx ����
```

## ����
��ԭ�����ͨ��`click`�¼�����`this.triggerEvent('click', { index })`�����и������ͨ�ţ�`mpvue`�޷���`event.mp`�ж�ȡ����ȷ��`detail`��ԭ������Ϊ`mpvue`��`click`�¼�����Ϊ`tap`����`this.triggerEvent('click', { index })`�޷��ҵ�`click`���

## ��ʱ�������
�޸������`click`�¼����ƣ����磺

`this.triggerEvent('click', { index })` => `this.triggerEvent('iclick', { index })`

��Ӧ��ģ���У�

`@click` => `@iclick`

> ע������ʾ�����޸���`action-sheet`��`modal`���

## ��Ӱ�����(����ֵ�����Ӱ��)
1. action-sheet
2. modal