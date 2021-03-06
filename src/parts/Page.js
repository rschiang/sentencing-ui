import { React, useState } from 'react';
import clsx from 'clsx';
import { AppBar, Avatar, Button, CircularProgress, Grid, Paper, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import GavelIcon from '@material-ui/icons/Gavel';
import HelpIcon from '@material-ui/icons/HelpOutline';
import FormAccordion from '../controls/FormAccordion';
import FormToolbar from '../controls/FormToolbar';
import AppForm from './AppForm';
import AppMenu from './AppMenu';
import CaseAccordion from './CaseAccordion';
import { formatSentence } from '../util';
import { fetchPrediction } from '../api';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
  logo: {
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.secondary[400],
  },
  title: {
    flexGrow: 1,
  },
  main: {
    width: '100vw',
    minHeight: '100vh',
    overflowX: 'hidden',
    backgroundColor: theme.palette.background.default,

    /* ToolBar mixin, but with padding */
    paddingTop: 56,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      paddingTop: 48,
    },
    [theme.breakpoints.up('sm')]: {
      paddingTop: 64,
    },
    [theme.breakpoints.up('md')]: {
      height: '100vh',
    }
  },
  pane: {
    [theme.breakpoints.up('md')]: {
      height: '100%',
      overflowY: 'scroll',
    },
  },
  content: {
    margin: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
  },
  controls: {
    marginTop: theme.spacing(2),
    alignSelf: 'end',
    [theme.breakpoints.up('md')]: {
      position: 'sticky',
      bottom: theme.spacing(4),
    },
  },
  progress: {
    alignSelf: 'center',
  },
  prediction: {
    padding: theme.spacing(2),
  },
  sentence: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  plot: {
    maxWidth: '100%',
    marginTop: theme.spacing(2),
  },
  descriptor: {
    color: theme.palette.text.secondary,
  },
  tipped: {
    display: 'flex',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: '1rem',
  },
  message: {
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
  helpMessage: {
    '& h5': {
      color: theme.palette.text.secondary,
    },
    '& h6': {
      margin: '1em 0',
      color: theme.palette.text.secondary,
    },
    '& li': {
      marginBottom: '0.5em',
    },
  },
  inlineButton: {
    verticalAlign: 'baseline',
    margin: '.5em .33em',
  },
}), { name: 'App' });

export default function App() {
  const classes = useStyles();

  // Form states
  const [crime, setCrime] = useState(-1);
  const [factors, setFactors] = useState({});

  // Application states
  const [status, setStatus] = useState('blank');
  const [data, setData] = useState({});
  const [errorCode, setErrorCode] = useState('');

  const handleCrimeChanged = (value) => {
    setCrime(value);

    // HACK: Forcefully set the factor on attempted crime.
    setFactors({...factors, mit_c25_2: (value == 2 ? 1 : 0)});

    // It would be better to integrate the whole stuff behind `CrimeSelector`
    // component (now removed, see history) and create better abstraction
    // rather than mechanically splitting them into “crime” and “factors,”
    // but we’re not tasked with questioning the research methods
    // so maybe it’s up to the other folks to fix that.
    // Don’t forget to cite that you read ’em here first!
  };

  const handleFactorChanged = (_, name, value) => {
    setFactors((factors) => ({...factors, [name]: value}));

    // HACK: Make these two factors exclusive.
    // We were going to implement this in a more generic, more delicate way
    // (as you can see from the specificity in spec), but due to … reasons
    // we’ll just go with the easier route to satisfy “rapid deliveries.”
    if (name === 'mit_c18_2' && value)
      handleFactorChanged(_, 'mit_c18_3', 0);   // Do remember that value:int

    else if (name === 'mit_c18_3' && value)
      handleFactorChanged(_, 'mit_c18_2', 0);   // We could’ve done type checking…

    // (Could’ve hard-wired more logic here
    // e.g. making mit_c63 dependent to the former two factors,
    // but additional contributions were considered voluntary [sic]
    // and thus we’ll just stick to what we were asked to help with.)
    // No need to thank for the idea above though. It’s free! ʕ •ᴥ•ʔ
  };

  const handleSubmitForm = () => {
    // Clear out the current information
    setErrorCode('');
    setStatus('loading');
    setData({});

    // Build up form request and call API
    fetchPrediction(crime, factors)
    .then((data) => {
      // Sort the related cases by their relevance, DESCending.
      // We assume there would be no NaNs again, as they are invalid JSON values.
      data.related_cases.sort((a, b) => (Math.round(b.relevance * 100) - Math.round(a.relevance * 100)));

      setData(data);
      setStatus('ready');
    })
    .catch((e) => {
      console.log(e);
      setErrorCode(e.message);
      setStatus('error');
    });
  };

  const handleClearForm = () => {
    setCrime(-1);
    setFactors({});
    setStatus('blank');
  };

  return (
    <div className={classes.root}>
      <AppBar position="fixed">
        <Toolbar>
          <Avatar className={classes.logo}>
            <GavelIcon />
          </Avatar>
          <Typography variant="h6" noWrap className={classes.title}>
            司法院量刑資訊系統
          </Typography>
          <AppMenu />
        </Toolbar>
      </AppBar>
      <Grid container component="main" className={classes.main}>
        <Grid item xs={12} md={6} lg={7} xl={6} component={Paper} elevation={3} className={classes.pane}>
          <div className={classes.content}>
            <AppForm crime={crime} factors={factors} onCrimeChanged={handleCrimeChanged} onFactorChanged={handleFactorChanged} />
            <FormToolbar className={classes.controls} canSubmit={crime >= 0} onSubmit={handleSubmitForm} onClear={handleClearForm} />
          </div>
        </Grid>
        <Grid item xs={12} md={6} lg={5} xl={6} className={classes.pane}>
          <div className={classes.content}>
            { status === 'loading' &&
              <CircularProgress className={classes.progress} />
            }
            { status === 'ready' &&
              <Paper elevation={1} className={classes.prediction}>
                <Typography variant="caption" component="h5" className={clsx(classes.descriptor, classes.tipped)}>
                  <span>量刑估計區間</span>
                  <Tooltip title={<span>
                      <b>E[<i>f(x)</i>]</b>：該類型犯罪的「量刑起點」（月數）。<br />
                      <b><i>f(x)</i></b>：在「量刑起點」上加減量刑因子權重後，得出的「個案量刑估計值」（月數）。<br />
                      <b>「量刑估計區間」</b>：將「個案量刑估計值」加減機器學習的平均絕對誤差值（MAE）後所得區間。其上、下限顯示可能超出法定刑或處斷刑之範圍，但實際個案科刑仍應遵守法定刑和處斷刑之法律規定。
                    </span>}>
                    <HelpIcon className={classes.helpIcon} />
                  </Tooltip>
                </Typography>
                <Typography variant="h4" component="div" className={classes.sentence}>{
                  (data.min_sentence < data.max_sentence) ?
                  `${formatSentence(data.min_sentence)} ~ ${formatSentence(data.max_sentence)}` :
                  formatSentence(data.min_sentence)
                }</Typography>
                { data.plot &&
                  <img src={data.plot} className={classes.plot} />
                }
                <FormAccordion defaultExpanded={true} summary={
                  <Typography variant="caption" component="h5" className={clsx(classes.descriptor, classes.tipped)}>
                    <span>相似判決</span>
                    <Tooltip title="本系統提供使用者輸入之量刑因子相類似之判決，使用餘弦相似度計算數值，數值越高相似程度越高。">
                      <HelpIcon className={classes.helpIcon} />
                    </Tooltip>
                  </Typography>
                }>
                  { data.related_cases.map((i) =>
                    <CaseAccordion key={i.id} {...i} />
                  )}
                </FormAccordion>
              </Paper>
            }
            { status === 'blank' &&
              <div className={classes.helpMessage}>
                <Typography variant="subtitle1" component="h5">「司法院109年刑事殺人罪案件量刑資訊系統資料庫更新」</Typography>
                <Typography variant="body2">
                  請按此下載
                  <Button variant="outlined" color="primary" className={classes.inlineButton}
                          href="https://reurl.cc/g82RNz" rel="external" target="_blank">
                          系統使用手冊
                  </Button>
                  。
                </Typography>
                <Typography variant="subtitle2">使用說明與聲明</Typography>
                <ol>
                  <li><strong><u>在使用本系統前，請務必詳讀「系統使用手冊」。</u></strong>系統使用手冊之內容，包含系統原理與注意事項、瀑布圖例說明及操作方法等。</li>
                  <li>本系統為實然面（法院實際上如何科刑）的展現，不能作為「應然面」（法院應如何科刑始為正確）的科刑指導。</li>
                  <li>本系統是一種「量刑資訊輔助系統」，<strong>不能擴張或壓縮法院依法得審酌各種量刑相關事由的裁量空間，也不能取代法律所規定的法定刑或處斷刑之上、下限。</strong></li>
                  <li>系統計算出的「量刑估計區間」是加入正負平均絕對誤差值所得出，因此區間的上、下限顯示，有可能超出法定刑或處斷刑之範圍，惟<strong><u>實際之個案科刑仍應遵守法定刑和處斷刑之法律規定。</u></strong></li>
                </ol>
              </div>
            }
            { status === 'error' &&
              <div className={classes.message}>
                <Typography variant="body1">伺服器或網路錯誤，請再試一次。</Typography>
                { errorCode && <Typography variant="caption">{ errorCode }</Typography> }
              </div>
            }
          </div>
        </Grid>
      </Grid>
    </div>
  );
}
