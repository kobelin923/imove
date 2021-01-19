import React, {
  useState,
  useEffect
} from 'react';

import 'antd/es/modal/style';
import styles from './index.module.less';

import { Graph } from '@antv/x6';
import { Modal, message } from 'antd';
import JsonView from 'react-json-view';
import { safeParse } from '../../../utils';
import analyzeDeps from '../../../utils/analyzeDeps';
import CodeEditor from '../../../components/codeEditor';

interface IProps {
  title?: string;
  flowChart: Graph;
}

const CodeEditModal: React.FC<IProps> = (props) => {

  const { title = '编辑代码', flowChart } = props;
  const [code, setCode] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);

  const updateNodeCode = (code: string): void => {
    const cell = flowChart.getSelectedCells()[0];
    const { dependencies } = cell.getData();
    cell.setData({ code });
    message.success('代码保存成功', 1);
    const excludeDeps = safeParse(dependencies);
    analyzeDeps(code, Object.keys(excludeDeps)).then((deps): void => {
      if (Object.keys(deps).length > 0) {
        Modal.info({
          title: '检测到您的代码有新依赖，已为您自动更新',
          content: (
            <div className={styles.depsInfoModalContent}>
              <JsonView
                src={deps}
                name={'dependencies'}
                collapsed={false}
                enableClipboard={false}
                displayDataTypes={false}
                displayObjectSize={false}
              />
            </div>
          ),
          onOk() {
            const newDeps = { ...excludeDeps, ...deps };
            cell.setData({
              code,
              dependencies: JSON.stringify(newDeps, null, 2)
            });
            // NOTE: notify basic panel to update dependency
            flowChart.trigger('settingBar.basicPanel:forceUpdate');
          },
        });
      }
    });
  };

  // life
  useEffect(() => {
    const handler = () => setVisible(true);
    flowChart.on('graph:editCode', handler);
    return () => {
      flowChart.off('graph:editCode', handler);
    };
  }, []);
  useEffect(() => {
    if (visible) {
      const cell = flowChart.getSelectedCells()[0];
      const { code } = cell.getData() || {};
      setCode(code);
    } else {
      setCode('');
    }
  }, [visible]);

  // events
  const onOk = (): void => {
    setVisible(false);
    updateNodeCode(code);
  };
  const onCancel = (): void => {
    setVisible(false);
  }
  const onChangeCode = (ev: any, newCode: string | undefined = ''): void => {
    setCode(newCode);
  };
  const onSaveCode = (newCode: string) => {
    updateNodeCode(newCode);
  };

  return (
    <Modal
      className={styles.modal}
      width={1000}
      title={title}
      okText={'保存'}
      visible={visible}
      cancelText={'取消'}
      onOk={onOk}
      onCancel={onCancel}
    >
      <CodeEditor
        value={code}
        width={'100%'}
        height={'600px'}
        onChange={onChangeCode}
        onSave={onSaveCode}
      />
    </Modal>
  );
};

export default CodeEditModal;